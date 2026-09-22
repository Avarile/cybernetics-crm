import { isDefined } from 'class-validator';
import { FieldMetadataType } from 'twenty-shared/types';

// Field types whose values are drawn from a fixed set of options.
export const fieldMetadataEnumTypes = [
  FieldMetadataType.MULTI_SELECT,
  FieldMetadataType.SELECT,
  FieldMetadataType.RATING,
] as const;

export type EnumFieldMetadataUnionType =
  (typeof fieldMetadataEnumTypes)[number];

// Type guard: true for enum-backed field types (select/multi-select/rating).
export const isEnumFieldMetadataType = (
  type: FieldMetadataType,
): type is EnumFieldMetadataUnionType =>
  isDefined(fieldMetadataEnumTypes.find((el) => type === el));
