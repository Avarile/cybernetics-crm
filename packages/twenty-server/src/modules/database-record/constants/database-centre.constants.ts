// Matches the sibling cybernetics-projects integration's proven UX limit
export const DATABASE_CENTRE_MAX_ATTACHMENTS_PER_RECORD = 10;

export const DATABASE_CENTRE_PREVIEW_FIELD_COUNT = 4;

export const DATABASE_CENTRE_PREVIEW_VALUE_LENGTH = 256;

// Field types whose text form is not useful as a preview value
export const DATABASE_CENTRE_PREVIEW_EXCLUDED_FIELD_TYPES = [
  'attachment',
  'button',
  'link',
];

export const DATABASE_CENTRE_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

export const DATABASE_CENTRE_REQUEST_TIMEOUT_MS = 15_000;

export const DATABASE_CENTRE_MAX_RECORDS_PAGE_SIZE = 200;

export const DATABASE_CENTRE_MAX_ERROR_MESSAGE_LENGTH = 300;

// Outbound calls per workspace, bounding what one workspace (or a runaway
// client) can send to the data centre
export const DATABASE_CENTRE_RATE_LIMIT_MAX_REQUESTS = 120;

export const DATABASE_CENTRE_RATE_LIMIT_WINDOW_MS = 60_000;

// Seconds; browse metadata changes rarely, so short-lived caching cuts
// upstream calls while the browse modal is open
export const DATABASE_CENTRE_CACHE_TTL_SECONDS = {
  bases: 60,
  tables: 60,
  table: 300,
  base: 300,
  schema: 120,
} as const;

// Snapshots older than this are refreshed by the background cron job
export const DATABASE_CENTRE_SNAPSHOT_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export const DATABASE_CENTRE_SNAPSHOT_REFRESH_BATCH_SIZE = 50;
