import { type ObjectRecord, RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { defaultMergeFieldValue } from 'src/engine/api/graphql/graphql-query-runner/utils/default-merge-field-value.util';

// A real merge reassigns each related record's foreign key to the surviving
// record, so ONE_TO_MANY just ends up with one combined set naturally. In a
// dry-run preview that reassignment hasn't happened yet, so this synthesizes
// the union of every merged record's related records to show what the result
// would look like.
export const mergeRelationFieldValuesForDryRunRecord = (
  recordsWithValues: { value: unknown; recordId: string }[],
  relationType: RelationType | undefined,
  priorityRecordId: string,
): ObjectRecord | ObjectRecord[] | null => {
  if (relationType === RelationType.ONE_TO_MANY) {
    return mergeOneToManyRelationArrays(recordsWithValues);
  }

  return defaultMergeFieldValue(
    recordsWithValues as { value: ObjectRecord | null; recordId: string }[],
    priorityRecordId,
  );
};

const mergeOneToManyRelationArrays = (
  recordsWithValues: { value: unknown; recordId: string }[],
): ObjectRecord[] => {
  const uniqueRelationsMap = new Map<string, ObjectRecord>();

  recordsWithValues.forEach(({ value }) => {
    if (Array.isArray(value)) {
      value.forEach((relation: ObjectRecord) => {
        if (isDefined(relation?.id)) {
          uniqueRelationsMap.set(relation.id, relation);
        }
      });
    }
  });

  return Array.from(uniqueRelationsMap.values());
};
