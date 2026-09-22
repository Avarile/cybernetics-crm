import { isDefined } from 'twenty-shared/utils';

export type ImapSyncCursor = {
  highestUid: number;
  uidValidity: number;
  modSeq?: string;
};

// Parses a stored JSON sync cursor, returning null for a missing or
// malformed value.
export const parseSyncCursor = (
  cursor: string | null,
): ImapSyncCursor | null => {
  if (!isDefined(cursor)) {
    return null;
  }

  try {
    return JSON.parse(cursor) as ImapSyncCursor;
  } catch {
    return null;
  }
};
