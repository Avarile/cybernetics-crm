import { isNonEmptyString } from '@sniptt/guards';
import { type DAVResponse } from 'tsdav';
import { isDefined } from 'twenty-shared/utils';

// Detects a 403 sync-collection response indicating the server invalidated
// the sync token, so the caller should fall back to a full re-sync.
export const isInvalidSyncTokenResponse = (
  responses: DAVResponse[],
): boolean => {
  const DAVResponse = responses[0];

  if (!isDefined(DAVResponse) || DAVResponse.status !== 403) return false;

  const body = isNonEmptyString(DAVResponse.raw)
    ? DAVResponse.raw
    : JSON.stringify(DAVResponse.raw ?? {});

  return body.includes('valid-sync-token') || body.includes('validSyncToken');
};
