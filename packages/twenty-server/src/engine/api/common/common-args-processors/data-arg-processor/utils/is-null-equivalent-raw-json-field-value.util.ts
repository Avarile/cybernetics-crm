import { isNull } from '@sniptt/guards';
import { isEmptyObject } from 'twenty-shared/utils';

// True when a raw-json field value should be treated as null: null itself
// or an empty object.
export const isNullEquivalentRawJsonFieldValue = (value: unknown): boolean => {
  if (isNull(value)) return true;

  return isEmptyObject(value);
};
