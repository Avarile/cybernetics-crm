import { type ObjectRecord } from 'twenty-shared/types';

import { type QueryResultFieldValue } from 'src/engine/api/graphql/workspace-query-runner/factories/query-result-getters/interfaces/query-result-field-value';

// Type guard: true if the result value wraps a nested `records` array
// (used by some group-by/aggregate result shapes).
export const isQueryResultFieldValueANestedRecordArray = (
  result: QueryResultFieldValue,
): result is { records: ObjectRecord[] } => {
  return 'records' in result && Array.isArray(result.records);
};
