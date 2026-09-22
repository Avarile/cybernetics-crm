import { type ObjectRecord } from 'twenty-shared/types';

import { type QueryResultFieldValue } from 'src/engine/api/graphql/workspace-query-runner/factories/query-result-getters/interfaces/query-result-field-value';

import { type CommonQueryResult } from 'src/engine/api/common/types/common-query-result.type';

// Type guard: true if the result value is a single object record (has an `id`).
export const isQueryResultFieldValueARecord = (
  result: QueryResultFieldValue | CommonQueryResult,
): result is ObjectRecord => {
  return 'id' in result;
};
