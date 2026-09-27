export const toIsoStringOrNull = (
  value: string | Date | null | undefined,
): string | null => {
  if (value == null) {
    return null;
  }

  // String inputs are assumed to already be ISO (eg: from GraphQL/DB), so only Date instances need converting.
  return value instanceof Date ? value.toISOString() : value;
};
