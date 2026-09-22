import { isDefined } from 'twenty-shared/utils';

import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';

// Parses the `?soft_delete=` REST query param into a boolean, defaulting
// to false.
export const parseSoftDeleteRestRequest = (
  request: AuthenticatedRequest,
): boolean => {
  if (!isDefined(request.query.soft_delete)) {
    return false;
  }

  return request.query.soft_delete === 'true';
};
