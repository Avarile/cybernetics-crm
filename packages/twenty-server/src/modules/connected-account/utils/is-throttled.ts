import { isDefined } from 'twenty-shared/utils';

import { MESSAGING_THROTTLE_DURATION } from 'src/modules/messaging/message-import-manager/constants/messaging-throttle-duration';
import { isValidDate } from 'src/utils/date/isValidDate';

// True if a channel is still in its explicit retry-after window or its
// exponential backoff window from prior throttle failures.
export const isThrottled = (
  syncStageStartedAt: string | null,
  throttleFailureCount: number,
  throttleRetryAfter?: string | null,
): boolean => {
  const now = new Date();

  const retryAfterCandidate = isDefined(throttleRetryAfter)
    ? new Date(throttleRetryAfter)
    : null;
  const retryAfterDate = isValidDate(retryAfterCandidate)
    ? retryAfterCandidate
    : null;

  if (isDefined(retryAfterDate) && retryAfterDate > now) {
    return true;
  }

  if (!syncStageStartedAt) {
    return false;
  }

  if (throttleFailureCount === 0) {
    return false;
  }

  const exponentialBackoffUntil = computeThrottlePauseUntil(
    syncStageStartedAt,
    throttleFailureCount,
  );

  return exponentialBackoffUntil > now;
};

// Exponential backoff from the stage start time, doubling per failure.
const computeThrottlePauseUntil = (
  syncStageStartedAt: string,
  throttleFailureCount: number,
): Date => {
  return new Date(
    new Date(syncStageStartedAt).getTime() +
      MESSAGING_THROTTLE_DURATION * Math.pow(2, throttleFailureCount - 1),
  );
};
