// True when an array field value should be treated as null: an empty array
// or null itself.
export const isNullEquivalentArrayFieldValue = (value: unknown): boolean => {
  return (Array.isArray(value) && value.length === 0) || value === null;
};
