import { type ObjectRecord } from 'twenty-shared/types';

import { type ConflictingFieldValue } from 'src/engine/api/common/common-query-runners/common-create-many-query-runner/types/conflicting-field-group.type';

// Reads a (possibly one-level-nested, e.g. "emails.primaryEmail") field
// value off a record by its dotted path.
export const getValueFromPath = (
  record: Partial<ObjectRecord>,
  path: string,
): ConflictingFieldValue | undefined => {
  const pathParts = path.split('.');

  if (pathParts.length === 1) {
    return record[path];
  }

  const [parentField, childField] = pathParts;

  return record[parentField]?.[childField];
};
