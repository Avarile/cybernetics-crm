// Normalizes raw ClickHouse rows for a table into EventLogRecord DTOs using
// the registry's per-table normalize function.
import { EventLogTable } from 'twenty-shared/types';

import { parseClickHouseDateTime } from 'src/database/clickHouse/clickHouse.util';
import { type EventLogRecord } from 'src/engine/core-modules/event-logs/dtos/event-log-result.dto';
import { EVENT_LOG_TYPES } from 'src/engine/core-modules/event-logs/registry/event-log-registry';

// Normalizes a batch of raw ClickHouse rows into EventLogRecord DTOs.
export const normalizeEventLogRecords = (
  records: Record<string, unknown>[],
  table: EventLogTable,
): EventLogRecord[] =>
  records.map((row) => ({
    ...EVENT_LOG_TYPES[table].normalize(row),
    timestamp: parseClickHouseDateTime(row.timestamp as string),
  }));
