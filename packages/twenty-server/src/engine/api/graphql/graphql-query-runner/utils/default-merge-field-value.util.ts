import { isDefined } from 'twenty-shared/utils';

import { hasRecordFieldValue } from 'src/engine/api/graphql/graphql-query-runner/utils/has-record-field-value.util';

// Default merge strategy for simple (non-array, non-composite) fields: keep
// the priority record's value if it's non-empty, otherwise fall back to the
// first other record that has one.
export const defaultMergeFieldValue = <T>(
  recordsWithValues: { value: T; recordId: string }[],
  priorityRecordId: string,
): T | null => {
  const priorityRecord = recordsWithValues.find(
    (record) => record.recordId === priorityRecordId,
  );

  if (isDefined(priorityRecord) && hasRecordFieldValue(priorityRecord.value)) {
    return priorityRecord.value;
  }

  const fallbackRecord = recordsWithValues.find((record) =>
    hasRecordFieldValue(record.value),
  );

  if (fallbackRecord) {
    return fallbackRecord.value;
  }

  return null;
};
