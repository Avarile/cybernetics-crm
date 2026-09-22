// Composite keys are structured as follows:
// COMPOSITE___{parentFieldName}_{childFieldName}
// These utils pre-process and post-process composite keys before and
// after querying the database.

export const compositeFieldPrefix = 'COMPOSITE___';

// Builds the flattened composite key for a field's sub-property.
export const createCompositeFieldKey = (
  fieldName: string,
  propertyName: string,
): string => {
  return `${compositeFieldPrefix}${fieldName}_${propertyName}`;
};

// Checks whether a key is a flattened composite field key.
export const isPrefixedCompositeField = (key: string): boolean => {
  return key.startsWith(compositeFieldPrefix);
};

// Splits a composite field key back into its parent/child field names,
// returning null if either part is missing.
export const parseCompositeFieldKey = (
  key: string,
): {
  parentFieldName: string;
  childFieldName: string;
} | null => {
  const [parentFieldName, childFieldName] = key
    .replace(compositeFieldPrefix, '')
    .split('_');

  if (!parentFieldName || !childFieldName) {
    return null;
  }

  return {
    parentFieldName,
    childFieldName,
  };
};
