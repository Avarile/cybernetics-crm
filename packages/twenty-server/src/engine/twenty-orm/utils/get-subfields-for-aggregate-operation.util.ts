import { FieldMetadataType } from 'twenty-shared/types';

import { isCompositeFieldMetadataType } from 'src/engine/metadata-modules/field-metadata/utils/is-composite-field-metadata-type.util';

// Deliberately a curated subset of each composite type's subfields, not the full list —
// drives which subfields get exposed as GraphQL aggregation options (see
// get-available-aggregations-from-object-fields.util.ts), limited to the ones where
// aggregating makes sense (eg: LINKS exposes primaryLinkUrl but not primaryLinkLabel).
export const getSubfieldsForAggregateOperation = (
  fieldType: FieldMetadataType,
): string[] | undefined => {
  if (!isCompositeFieldMetadataType(fieldType)) {
    return undefined;
  } else {
    switch (fieldType) {
      case FieldMetadataType.CURRENCY:
        return ['amountMicros', 'currencyCode'];
      case FieldMetadataType.FULL_NAME:
        return ['firstName', 'lastName'];
      case FieldMetadataType.ADDRESS:
        return [
          'addressStreet1',
          'addressStreet2',
          'addressCity',
          'addressPostcode',
          'addressState',
          'addressCountry',
          'addressLat',
          'addressLng',
        ];
      case FieldMetadataType.LINKS:
        return ['primaryLinkUrl'];
      case FieldMetadataType.ACTOR:
        return ['workspaceMemberId', 'source'];
      case FieldMetadataType.EMAILS:
        return ['primaryEmail'];
      case FieldMetadataType.PHONES:
        return [
          'primaryPhoneNumber',
          'primaryPhoneCountryCode',
          'primaryPhoneCallingCode',
        ];
      case FieldMetadataType.RICH_TEXT:
        return ['blocknote', 'markdown'];
      default:
        throw new Error(`Unsupported composite field type: ${fieldType}`);
    }
  }
};
