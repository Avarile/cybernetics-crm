import { isNonEmptyString } from '@sniptt/guards';
import { FieldMetadataType } from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';

// node-postgres returns bigint/numeric/double-precision columns as strings by default
// (see set-pg-date-type-parser.ts for the analogous DATE case), so amountMicros and
// lat/lng need explicit parsing back to numbers here.
export const formatCompositeFieldValue = (
  value: unknown,
  compositePropertyName: string,
  fieldMetadata: FlatFieldMetadata,
) => {
  switch (fieldMetadata.type) {
    case FieldMetadataType.CURRENCY: {
      if (compositePropertyName === 'amountMicros') {
        if (isNonEmptyString(value)) {
          return parseInt(value);
        }

        return value;
      }
      break;
    }
    case FieldMetadataType.ADDRESS: {
      if (
        compositePropertyName === 'addressLat' ||
        compositePropertyName === 'addressLng'
      ) {
        if (isNonEmptyString(value)) {
          return parseFloat(value);
        }

        return value;
      }
      break;
    }
  }

  return value;
};
