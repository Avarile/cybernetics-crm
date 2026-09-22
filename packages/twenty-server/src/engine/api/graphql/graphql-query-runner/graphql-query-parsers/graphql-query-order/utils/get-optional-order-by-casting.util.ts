import { FieldMetadataType } from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';

// Returns a ::text cast suffix for select/multi-select fields (needed
// before applying LOWER() in raw group-by order expressions), or '' otherwise.
export const getOptionalOrderByCasting = (
  fieldMetadata: Pick<FlatFieldMetadata, 'type'>,
): string => {
  if (
    fieldMetadata.type === FieldMetadataType.SELECT ||
    fieldMetadata.type === FieldMetadataType.MULTI_SELECT
  ) {
    return '::text';
  }

  return '';
};
