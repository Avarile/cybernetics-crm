import { isDefined } from 'twenty-shared/utils';

import { CALENDAR_IMPORT_ONGOING_SYNC_TIMEOUT } from 'src/modules/calendar/calendar-event-import-manager/constants/calendar-import-ongoing-sync-timeout.constant';

// True if a sync stage has been running longer than the ongoing-sync timeout
// (or was never started), meaning it's stuck and should be reset.
export const isSyncStale = (syncStageStartedAt?: string | null): boolean => {
  if (!isDefined(syncStageStartedAt)) {
    return true;
  }

  const syncStageStartedTime = new Date(syncStageStartedAt).getTime();

  if (isNaN(syncStageStartedTime)) {
    throw new Error('Invalid date format');
  }

  return (
    Date.now() - syncStageStartedTime > CALENDAR_IMPORT_ONGOING_SYNC_TIMEOUT
  );
};
