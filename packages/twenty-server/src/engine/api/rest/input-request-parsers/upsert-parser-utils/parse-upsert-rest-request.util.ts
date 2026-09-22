import { isDefined } from 'twenty-shared/utils';

import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';

// Parses the `?upsert=` REST query param into a boolean, defaulting to
// false.
export const parseUpsertRestRequest = (
  request: AuthenticatedRequest,
): boolean => {
  if (!isDefined(request.query.upsert)) {
    return false;
  }

  return request.query.upsert === 'true';
};
