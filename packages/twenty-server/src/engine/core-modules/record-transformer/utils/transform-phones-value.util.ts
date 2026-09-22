// Validates and normalizes a PHONES field's GraphQL input value before persistence.
import { msg } from '@lingui/core/macro';
import { isArray, isNonEmptyString } from '@sniptt/guards';
import {
  type CountryCallingCode,
  parsePhoneNumberWithError,
} from 'libphonenumber-js';
import isEmpty from 'lodash.isempty';
import { type AdditionalPhoneMetadata } from 'twenty-shared/types';
import {
  getCountryCodesForCallingCode,
  isDefined,
  isValidCountryCode,
  parseJson,
  removeUndefinedFields,
} from 'twenty-shared/utils';

import {
  RecordTransformerException,
  RecordTransformerExceptionCode,
} from 'src/engine/core-modules/record-transformer/record-transformer.exception';

export type PhonesFieldGraphQLInput =
  | {
      primaryPhoneNumber?: string | null;
      primaryPhoneCountryCode?: string | null;
      primaryPhoneCallingCode?: string | null;
      additionalPhones?: string | Partial<AdditionalPhoneMetadata>[] | null;
    }
  | null
  | undefined;

type AdditionalPhoneMetadataWithNumber = Partial<AdditionalPhoneMetadata> &
  Required<Pick<AdditionalPhoneMetadata, 'number'>>;

// Strips leading `+` from a calling code string for libphonenumber-js.
const removePlusFromString = (str: string) => str.replace(/\+/g, '');

// Converts an empty string to null while passing through null/undefined as-is.
const nullIfEmptyString = (value: string | null | undefined) =>
  !isDefined(value) ? value : isNonEmptyString(value) ? value : null;

// Validates a country code and calling code independently, and checks they
// aren't mutually inconsistent.
const validatePrimaryPhoneCountryCodeAndCallingCode = ({
  callingCode,
  countryCode,
}: {
  callingCode?: string | null;
  countryCode?: string | null;
}) => {
  if (isNonEmptyString(countryCode) && !isValidCountryCode(countryCode)) {
    throw new RecordTransformerException(
      `Invalid country code ${countryCode}`,
      RecordTransformerExceptionCode.INVALID_PHONE_COUNTRY_CODE,
      { userFriendlyMessage: msg`Invalid country code ${countryCode}` },
    );
  }

  if (!isNonEmptyString(callingCode)) {
    return;
  }

  const expectedCountryCodes = getCountryCodesForCallingCode(callingCode);

  if (expectedCountryCodes.length === 0) {
    throw new RecordTransformerException(
      `Invalid calling code ${callingCode}`,
      RecordTransformerExceptionCode.INVALID_PHONE_CALLING_CODE,
      { userFriendlyMessage: msg`Invalid calling code ${callingCode}` },
    );
  }

  if (
    isNonEmptyString(countryCode) &&
    expectedCountryCodes.every(
      (expectedCountryCode) => expectedCountryCode !== countryCode,
    )
  ) {
    throw new RecordTransformerException(
      `Provided country code and calling code are conflicting`,
      RecordTransformerExceptionCode.CONFLICTING_PHONE_CALLING_CODE_AND_COUNTRY_CODE,
      {
        userFriendlyMessage: msg`Provided country code and calling code are conflicting`,
      },
    );
  }
};

// Parses a phone number with libphonenumber-js, converting parse failures
// into a RecordTransformerException.
const parsePhoneNumberExceptionWrapper = ({
  callingCode,
  countryCode,
  number,
}: AdditionalPhoneMetadataWithNumber) => {
  try {
    return parsePhoneNumberWithError(number, {
      defaultCallingCode: callingCode
        ? removePlusFromString(callingCode)
        : callingCode,
      defaultCountry: countryCode,
    });
  } catch {
    throw new RecordTransformerException(
      `Provided phone number is invalid ${number}`,
      RecordTransformerExceptionCode.INVALID_PHONE_NUMBER,
      { userFriendlyMessage: msg`Provided phone number is invalid ${number}` },
    );
  }
};

// Parses the phone number and cross-checks the inferred country/calling
// code against any explicitly provided ones, throwing on conflicts.
const validateAndInferMetadataFromPrimaryPhoneNumber = ({
  callingCode,
  countryCode,
  number,
}: AdditionalPhoneMetadataWithNumber): Partial<AdditionalPhoneMetadata> => {
  const phone = parsePhoneNumberExceptionWrapper({
    callingCode,
    countryCode,
    number,
  });

  if (
    isNonEmptyString(phone.country) &&
    isNonEmptyString(countryCode) &&
    phone.country !== countryCode
  ) {
    throw new RecordTransformerException(
      'Provided and inferred country code are conflicting',
      RecordTransformerExceptionCode.CONFLICTING_PHONE_COUNTRY_CODE,
      {
        userFriendlyMessage: msg`Provided and inferred country code are conflicting`,
      },
    );
  }

  if (
    isNonEmptyString(phone.countryCallingCode) &&
    isNonEmptyString(callingCode) &&
    phone.countryCallingCode !== removePlusFromString(callingCode)
  ) {
    throw new RecordTransformerException(
      'Provided and inferred calling code are conflicting',
      RecordTransformerExceptionCode.CONFLICTING_PHONE_CALLING_CODE,
      {
        userFriendlyMessage: msg`Provided and inferred calling code are conflicting`,
      },
    );
  }

  const finalPrimaryPhoneCallingCode =
    callingCode ??
    (`+${phone.countryCallingCode}` as undefined | CountryCallingCode);
  const finalPrimaryPhoneCountryCode = countryCode ?? phone.country;

  return {
    countryCode: finalPrimaryPhoneCountryCode,
    callingCode: finalPrimaryPhoneCallingCode,
    number: phone.nationalNumber,
  };
};

// Validates a single phone entry, inferring country/calling code from the
// number when a number is present, otherwise just normalizing empty strings.
const validateAndInferPhoneInput = ({
  callingCode,
  countryCode,
  number,
}: {
  callingCode?: string | null;
  countryCode?: string | null;
  number?: string | null;
}) => {
  validatePrimaryPhoneCountryCodeAndCallingCode({ callingCode, countryCode });

  if (isNonEmptyString(number)) {
    return validateAndInferMetadataFromPrimaryPhoneNumber({
      number,
      callingCode: isNonEmptyString(callingCode) ? callingCode : undefined,
      countryCode:
        isNonEmptyString(countryCode) && isValidCountryCode(countryCode)
          ? countryCode
          : undefined,
    });
  }

  return {
    callingCode: nullIfEmptyString(callingCode),
    countryCode: nullIfEmptyString(countryCode),
    number: nullIfEmptyString(number),
  };
};

type TransformPhonesValueArgs = {
  input: PhonesFieldGraphQLInput;
};
// Normalizes a PHONES field's input: validates/infers the primary phone's
// country and calling code, and validates each additional phone the same way.
export const transformPhonesValue = ({
  input,
}: TransformPhonesValueArgs): PhonesFieldGraphQLInput => {
  if (!isDefined(input)) {
    return input;
  }

  const { additionalPhones, ...primary } = input;
  const {
    callingCode: primaryPhoneCallingCode,
    countryCode: primaryPhoneCountryCode,
    number: primaryPhoneNumber,
  } = validateAndInferPhoneInput({
    callingCode: primary.primaryPhoneCallingCode,
    countryCode: primary.primaryPhoneCountryCode,
    number: primary.primaryPhoneNumber,
  });

  const parsedAdditionalPhones = isNonEmptyString(additionalPhones)
    ? (parseJson<Partial<AdditionalPhoneMetadata>[]>(additionalPhones) ?? [])
    : isArray(additionalPhones)
      ? additionalPhones
      : [];

  const validatedAdditionalPhones = parsedAdditionalPhones.map(
    validateAndInferPhoneInput,
  );

  return removeUndefinedFields({
    additionalPhones: isEmpty(validatedAdditionalPhones)
      ? null
      : JSON.stringify(validatedAdditionalPhones),
    primaryPhoneCallingCode,
    primaryPhoneCountryCode,
    primaryPhoneNumber,
  });
};
