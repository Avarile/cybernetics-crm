import {
  type FieldMetadataDefaultValueForAnyType,
  type FieldMetadataDefaultValueFunctionNames,
  type FieldMetadataFunctionDefaultValue,
  fieldMetadataDefaultValueFunctionName,
} from 'twenty-shared/types';

// Type guard: true when a default value is a known SQL function name (e.g.
// "uuid", "now") rather than a static quoted/literal value.
export const isFunctionDefaultValue = (
  defaultValue: FieldMetadataDefaultValueForAnyType,
): defaultValue is FieldMetadataFunctionDefaultValue => {
  return (
    typeof defaultValue === 'string' &&
    !defaultValue.startsWith("'") &&
    Object.values(fieldMetadataDefaultValueFunctionName).includes(
      defaultValue as FieldMetadataDefaultValueFunctionNames,
    )
  );
};
