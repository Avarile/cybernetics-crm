import { FieldMetadataType, type CompositeProperty } from 'twenty-shared/types';

export function computeCompositeFieldTypeOptions(
  property: CompositeProperty<FieldMetadataType>,
) {
  return {
    nullable: !property.isRequired,
    // A MULTI_SELECT composite subfield is always array-shaped regardless of
    // its own isArray flag.
    isArray:
      property.type === FieldMetadataType.MULTI_SELECT || property.isArray,
  };
}
