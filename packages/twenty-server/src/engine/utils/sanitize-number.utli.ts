import { isDefined } from 'twenty-shared/utils';
export const sanitizeNumber = (value: number | null): number | null => {
  // NaN is a "defined" number as far as isDefined is concerned, but it's not valid
  // JSON/DB data, so it needs its own check.
  if (!isDefined(value) || Number.isNaN(value)) {
    return null;
  }

  return value;
};
