import { isDefined } from 'twenty-shared/utils';

import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';

// Parses the `?viewId=` REST query param used to apply a saved view's
// filters to a groupBy request.
export const parseViewIdRestRequest = (
  request: AuthenticatedRequest,
): string | undefined => {
  if (
    !isDefined(request.query.viewId) ||
    typeof request.query.viewId !== 'string'
  )
    return undefined;

  return request.query.viewId;
};
