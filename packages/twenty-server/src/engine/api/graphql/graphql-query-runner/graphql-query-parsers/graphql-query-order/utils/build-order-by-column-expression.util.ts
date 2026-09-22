// Small helpers for building ORDER BY expressions: which field types
// need case-insensitive (LOWER()) ordering, which need a ::text cast
// first, and how to build the raw "table.column" expression.
import { FieldMetadataType } from 'twenty-shared/types';

// Text/select/multi-select fields sort case-insensitively.
export const shouldUseCaseInsensitiveOrder = (
  fieldType: FieldMetadataType,
): boolean => {
  return (
    fieldType === FieldMetadataType.TEXT ||
    fieldType === FieldMetadataType.SELECT ||
    fieldType === FieldMetadataType.MULTI_SELECT
  );
};

// Select/multi-select fields are stored as enum-like values and need a
// ::text cast before LOWER() can be applied.
export const shouldCastToText = (fieldType: FieldMetadataType): boolean => {
  return (
    fieldType === FieldMetadataType.SELECT ||
    fieldType === FieldMetadataType.MULTI_SELECT
  );
};

// Returns unquoted column expression for TypeORM's orderBy (e.g., "company.name")
// Quoting and LOWER() wrapping is handled in getOrderByRawSQL
export const buildOrderByColumnExpression = (
  prefix: string,
  columnName: string,
): string => {
  return `${prefix}.${columnName}`;
};
