/* @license Enterprise */

// Deletes ClickHouse event-log rows older than a workspace's retention
// window, iterating over every known event log table.

import { Injectable, Logger } from '@nestjs/common';

import { EventLogTable } from 'twenty-shared/types';

import { ClickHouseService } from 'src/database/clickHouse/clickHouse.service';
import { formatDateTimeForClickHouse } from 'src/database/clickHouse/clickHouse.util';
import { getClickHouseTableName } from 'src/engine/core-modules/event-logs/registry/event-log-registry';

export type EventLogCleanupParams = {
  workspaceId: string;
  retentionDays: number;
};

@Injectable()
export class EventLogCleanupService {
  private readonly logger = new Logger(EventLogCleanupService.name);

  constructor(private readonly clickHouseService: ClickHouseService) {}

  // Issues a ClickHouse lightweight delete for rows older than the cutoff
  // date, per event log table, tolerating per-table failures.
  async cleanupWorkspaceEventLogs({
    workspaceId,
    retentionDays,
  }: EventLogCleanupParams): Promise<void> {
    if (!this.clickHouseService.getMainClient()) {
      this.logger.debug(
        'ClickHouse not configured, skipping event log cleanup',
      );

      return;
    }

    const cutoffDate = new Date();

    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    for (const table of Object.values(EventLogTable)) {
      const tableName = getClickHouseTableName(table);

      try {
        const success = await this.clickHouseService.executeCommand(
          `ALTER TABLE ${tableName} DELETE WHERE "workspaceId" = {workspaceId:String} AND "timestamp" < {cutoffDate:DateTime64(3)}`,
          {
            workspaceId,
            cutoffDate: formatDateTimeForClickHouse(cutoffDate),
          },
        );

        if (success) {
          this.logger.log(
            `Scheduled deletion of old ${tableName} events for workspace ${workspaceId} (retention: ${retentionDays} days)`,
          );
        } else {
          this.logger.warn(
            `Failed to schedule deletion for ${tableName} in workspace ${workspaceId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error cleaning up ${tableName} for workspace ${workspaceId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
