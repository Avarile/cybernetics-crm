import { t } from '@lingui/core/macro';

import { type DatabaseCentreSnapshotStatus } from '@/database-centre/types/DatabaseCentre';
import { type TagColor } from 'twenty-ui/data-display';

// OK snapshots need no badge; the others explain why a preview may be off
export const getDatabaseRecordSnapshotStatusTag = (
  snapshotStatus: DatabaseCentreSnapshotStatus,
): { label: string; color: TagColor } | null => {
  switch (snapshotStatus) {
    case 'MISSING':
      return { label: t`Deleted`, color: 'red' };
    case 'FORBIDDEN':
      return { label: t`No access`, color: 'orange' };
    case 'STALE':
      return { label: t`Outdated`, color: 'yellow' };
    default:
      return null;
  }
};
