import {
  type FieldMetadataType,
  type CompositeType,
  compositeTypeDefinitions,
} from 'twenty-shared/types';

import {
  FieldMetadataException,
  FieldMetadataExceptionCode,
} from 'src/engine/metadata-modules/field-metadata/field-metadata.exception';

// Looks up a composite field type's sub-property definitions, throwing if
// the field type isn't actually composite.
export const getCompositeTypeOrThrow = (
  fieldType: FieldMetadataType,
): CompositeType => {
  const compositeType = compositeTypeDefinitions.get(fieldType);

  if (!compositeType) {
    throw new FieldMetadataException(
      `Composite type not found for field metadata type: ${fieldType}`,
      FieldMetadataExceptionCode.UNCOVERED_FIELD_METADATA_TYPE_VALIDATION,
    );
  }

  return compositeType;
};
