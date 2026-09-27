import { type FieldMetadataDefaultOption } from 'src/engine/metadata-modules/field-metadata/dtos/options.input';

// GraphQL enum value names can't start with a digit, so a SELECT option like "2024"
// needs an underscore prefix to be usable as a generated enum member.
export function transformEnumValue(options?: FieldMetadataDefaultOption[]) {
  return options?.map((option) => {
    if (/^\d/.test(option.value)) {
      return {
        ...option,
        value: `_${option.value}`,
      };
    }

    return option;
  });
}
