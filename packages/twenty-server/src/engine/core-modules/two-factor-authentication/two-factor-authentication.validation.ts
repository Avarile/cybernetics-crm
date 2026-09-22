import { isDefined } from 'twenty-shared/utils';

import { type CustomException } from 'src/utils/custom-exception';

import {
  TwoFactorAuthenticationException,
  TwoFactorAuthenticationExceptionCode,
} from './two-factor-authentication.exception';

import { type TwoFactorAuthenticationMethodEntity } from './entities/two-factor-authentication-method.entity';
import { OTPStatus } from './strategies/otp/otp.constants';

// Throws unless a 2FA method is defined
const assertIsDefinedOrThrow = (
  twoFactorAuthenticationMethod:
    | TwoFactorAuthenticationMethodEntity
    | undefined
    | null,
  exceptionToThrow: CustomException = new TwoFactorAuthenticationException(
    '2FA method not found',
    TwoFactorAuthenticationExceptionCode.TWO_FACTOR_AUTHENTICATION_METHOD_NOT_FOUND,
  ),
): asserts twoFactorAuthenticationMethod is TwoFactorAuthenticationMethodEntity => {
  if (!isDefined(twoFactorAuthenticationMethod)) {
    throw exceptionToThrow;
  }
};

// Whether the user has any 2FA methods at all
const areTwoFactorAuthenticationMethodsDefined = (
  twoFactorAuthenticationMethods:
    | TwoFactorAuthenticationMethodEntity[]
    | undefined
    | null,
): twoFactorAuthenticationMethods is TwoFactorAuthenticationMethodEntity[] => {
  return (
    isDefined(twoFactorAuthenticationMethods) &&
    twoFactorAuthenticationMethods.length > 0
  );
};

// Whether at least one of the user's 2FA methods has completed verification
const isAnyTwoFactorAuthenticationMethodVerified = (
  twoFactorAuthenticationMethods: TwoFactorAuthenticationMethodEntity[],
) => {
  return (
    twoFactorAuthenticationMethods.filter(
      (method) => method.status === OTPStatus.VERIFIED,
    ).length > 0
  );
};

// Namespaced helpers for validating a user's collection of 2FA methods
export const twoFactorAuthenticationMethodsValidator: {
  assertIsDefinedOrThrow: typeof assertIsDefinedOrThrow;
  areDefined: typeof areTwoFactorAuthenticationMethodsDefined;
  areVerified: typeof isAnyTwoFactorAuthenticationMethodVerified;
} = {
  assertIsDefinedOrThrow,
  areDefined: areTwoFactorAuthenticationMethodsDefined,
  areVerified: isAnyTwoFactorAuthenticationMethodVerified,
};
