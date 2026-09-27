import { Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { IsNull, LessThan } from 'typeorm';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import {
  DATABASE_CENTRE_SNAPSHOT_REFRESH_BATCH_SIZE,
  DATABASE_CENTRE_SNAPSHOT_STALE_AFTER_MS,
} from 'src/modules/database-record/constants/database-centre.constants';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';
import { DatabaseConnectionService } from 'src/modules/database-record/services/database-connection.service';
import { DatabaseRecordAttachmentService } from 'src/modules/database-record/services/database-record-attachment.service';
import { type DatabaseRecordTargetWorkspaceEntity } from 'src/modules/database-record/standard-objects/database-record-target.workspace-entity';

export type DatabaseRecordSnapshotRefreshJobData = {
  workspaceId: string;
};

// Connection-level failures: every other record would fail the same way,
// so the run stops instead of hammering the data centre
const RUN_ABORTING_EXCEPTION_CODES = [
  DatabaseCentreExceptionCode.CONNECTION_NOT_CONFIGURED,
  DatabaseCentreExceptionCode.CONNECTION_DISABLED,
  DatabaseCentreExceptionCode.TOKEN_DECRYPTION_FAILED,
  DatabaseCentreExceptionCode.INVALID_BASE_URL,
  DatabaseCentreExceptionCode.UPSTREAM_UNAUTHORIZED,
  DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
  DatabaseCentreExceptionCode.UPSTREAM_RATE_LIMITED,
];

@Processor(MessageQueue.workspaceQueue)
// Refreshes one workspace's stale data-centre snapshots in a bounded batch,
// flipping attachments to MISSING/FORBIDDEN when the upstream record is
// gone or no longer accessible.
export class DatabaseRecordSnapshotRefreshJob {
  private readonly logger = new Logger(DatabaseRecordSnapshotRefreshJob.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly databaseConnectionService: DatabaseConnectionService,
    private readonly databaseRecordAttachmentService: DatabaseRecordAttachmentService,
  ) {}

  @Process(DatabaseRecordSnapshotRefreshJob.name)
  async handle({
    workspaceId,
  }: DatabaseRecordSnapshotRefreshJobData): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<DatabaseRecordTargetWorkspaceEntity>(
          workspaceId,
          'databaseRecordTarget',
          { shouldBypassPermissionChecks: true },
        );

      const staleBefore = new Date(
        Date.now() - DATABASE_CENTRE_SNAPSHOT_STALE_AFTER_MS,
      ).toISOString();

      const staleTargets = await repository.find({
        where: [
          { snapshotAt: LessThan(staleBefore) },
          { snapshotAt: IsNull() },
        ],
        order: { snapshotAt: 'ASC' },
        take: DATABASE_CENTRE_SNAPSHOT_REFRESH_BATCH_SIZE,
      });

      if (staleTargets.length === 0) {
        return;
      }

      let activeConnection;

      try {
        activeConnection =
          await this.databaseConnectionService.getActiveConnectionOrThrow(
            workspaceId,
          );
      } catch (error) {
        if (this.isRunAborting(error)) {
          return;
        }

        throw error;
      }

      let refreshedCount = 0;

      for (const target of staleTargets) {
        try {
          const update =
            await this.databaseRecordAttachmentService.buildRefreshUpdate(
              activeConnection,
              workspaceId,
              target,
            );

          await repository.update({ id: target.id }, update);
          refreshedCount++;
        } catch (error) {
          if (this.isRunAborting(error)) {
            this.logger.warn(
              `Stopping snapshot refresh for workspace ${workspaceId}: ${(error as Error).message}`,
            );
            break;
          }

          // Keeps the last good preview but marks it outdated and bumps
          // snapshotAt, so a permanently failing record rotates to the back
          // of the queue instead of blocking every future batch
          await repository.update(
            { id: target.id },
            { snapshotStatus: 'STALE', snapshotAt: new Date().toISOString() },
          );

          this.logger.warn(
            `Failed to refresh data centre record ${target.id} in workspace ${workspaceId}: ${(error as Error).message}`,
          );
        }
      }

      this.logger.log(
        `Refreshed ${refreshedCount}/${staleTargets.length} data centre snapshots for workspace ${workspaceId}`,
      );
    }, authContext);
  }

  private isRunAborting(error: unknown): boolean {
    return (
      error instanceof DatabaseCentreException &&
      isDefined(error.code) &&
      RUN_ABORTING_EXCEPTION_CODES.includes(error.code)
    );
  }
}
