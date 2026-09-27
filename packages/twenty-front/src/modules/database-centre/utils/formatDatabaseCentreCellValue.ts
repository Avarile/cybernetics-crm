import { isDefined } from 'twenty-shared/utils';

// Records are fetched with cellFormat=text, but lookups and multi-value
// cells can still arrive as arrays or objects
export const formatDatabaseCentreCellValue = (value: unknown): string => {
  if (!isDefined(value)) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(formatDatabaseCentreCellValue).join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};
