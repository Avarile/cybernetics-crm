import { isDefined } from 'twenty-shared/utils';

import { WEBHOOK_SYNC_STALENESS_THRESHOLD_MS } from 'src/modules/connected-account/webhook-subscription-manager/constants/webhook-sync-staleness-threshold-ms.constant';

// True if a channel's last successful sync is older than the staleness
// threshold (or never synced), used to decide whether polling should still
// run alongside an active webhook subscription.
export const isLastSuccessfulSyncStale = (
  syncedAt?: string | null,
): boolean => {
  if (!isDefined(syncedAt)) {
    return true;
  }

  const syncedTime = new Date(syncedAt).getTime();

  if (isNaN(syncedTime)) {
    throw new Error('Invalid date format');
  }

  return Date.now() - syncedTime > WEBHOOK_SYNC_STALENESS_THRESHOLD_MS;
};
