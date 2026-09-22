// Recursively reshapes a raw TypeORM query result into GraphQL-friendly
// output: strips underscore prefixes graphql-js adds to reserved
// __typename-like keys, and un-flattens COMPOSITE___ prefixed keys back
// into nested objects.
import {
  isPrefixedCompositeField,
  parseCompositeFieldKey,
} from 'src/engine/api/graphql/workspace-query-builder/utils/composite-field-metadata.util';

// Un-flattens one COMPOSITE___parent_child key into result[parent][child] = value.
export const handleCompositeKey = (
  // oxlint-disable-next-line typescript/no-explicit-any
  result: any,
  key: string,
  // oxlint-disable-next-line typescript/no-explicit-any
  value: any,
): void => {
  const parsedFieldKey = parseCompositeFieldKey(key);

  // If composite field key can't be parsed, return
  if (!parsedFieldKey) {
    return;
  }

  if (!result[parsedFieldKey.parentFieldName]) {
    result[parsedFieldKey.parentFieldName] = {};
  }

  result[parsedFieldKey.parentFieldName][parsedFieldKey.childFieldName] = value;
};

// oxlint-disable-next-line typescript/no-explicit-any
// Recursively walks a raw query result object/array, un-flattening
// composite field keys and cleaning up __typename values.
export const parseResult = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || typeof obj === 'function') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => parseResult(item));
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  const result: any = {};

  for (const key in obj) {
    // oxlint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = parseResult(obj[key]);
      } else if (key === '__typename') {
        result[key] = obj[key].replace(/^_*/, '');
      } else if (isPrefixedCompositeField(key)) {
        handleCompositeKey(result, key, obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }

  return result;
};
