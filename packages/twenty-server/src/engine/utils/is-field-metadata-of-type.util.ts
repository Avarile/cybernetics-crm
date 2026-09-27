import { type FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';

// Type guard, not just an equality check: narrows the caller's FieldMetadataEntity to
// the type-specific variant so its `settings`/`options` fields are typed correctly.
export function isFieldMetadataEntityOfType<
  Field extends FieldMetadataEntity,
  Type extends FieldMetadataType,
>(
  fieldMetadata: Pick<Field, 'type'>,
  type: Type,
): fieldMetadata is Field & FieldMetadataEntity<Type> {
  return fieldMetadata.type === type;
}
