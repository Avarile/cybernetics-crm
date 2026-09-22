import { type CompositeProperty, FieldMetadataType } from 'twenty-shared/types';

// True unless the sub-property is hidden or a raw JSON value, neither of
// which can be meaningfully grouped by.
export const isCompositePropertySupportedInGroupBy = (
  property: CompositeProperty,
): boolean => {
  return (
    property.hidden !== true && property.type !== FieldMetadataType.RAW_JSON
  );
};
