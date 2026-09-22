import { isDefined } from 'twenty-shared/utils';

import { POSTGRESQL_ERROR_CODES } from 'src/engine/api/graphql/workspace-query-runner/constants/postgres-error-codes.constants';

// Checks whether an unknown error is a Postgres "query canceled" error
// (e.g. from a statement timeout).
export const isQueryCanceledError = (error: unknown): boolean => {
  if (!isDefined(error) || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  return error.code === POSTGRESQL_ERROR_CODES.QUERY_CANCELED;
};
