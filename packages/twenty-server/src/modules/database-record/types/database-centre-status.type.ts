// Mirrors the SELECT options declared on databaseConnection.lastVerificationStatus
export const DATABASE_CONNECTION_VERIFICATION_STATUSES = [
  'OK',
  'UNREACHABLE',
  'UNAUTHORIZED',
  'UNVERIFIED',
] as const;

export type DatabaseConnectionVerificationStatus =
  (typeof DATABASE_CONNECTION_VERIFICATION_STATUSES)[number];

// Mirrors the SELECT options declared on databaseRecordTarget.snapshotStatus
export const DATABASE_RECORD_SNAPSHOT_STATUSES = [
  'OK',
  'MISSING',
  'FORBIDDEN',
  'STALE',
] as const;

export type DatabaseRecordSnapshotStatus =
  (typeof DATABASE_RECORD_SNAPSHOT_STATUSES)[number];
