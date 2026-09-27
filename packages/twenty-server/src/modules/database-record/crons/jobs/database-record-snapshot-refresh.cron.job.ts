import { InjectRepository } from '@nestjs/typeorm';

import { FeatureFlagKey } from 'twenty-shared/types';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import {
  DatabaseRecordSnapshotRefreshJob,
  type DatabaseRecordSnapshotRefreshJobData,
} from 'src/modules/database-record/jobs/database-record-snapshot-refresh.job';

export const DATABASE_RECORD_SNAPSHOT_REFRESH_CRON_PATTERN = '17 * * * *';

@Processor({
  queueName: MessageQueue.cronQueue,
})
// Hourly, queues a snapshot refresh for every active workspace that has the
// data-centre integration enabled.
export class DatabaseRecordSnapshotRefreshCronJob {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  @Process(DatabaseRecordSnapshotRefreshCronJob.name)
  @SentryCronMonitor(
    DatabaseRecordSnapshotRefreshCronJob.name,
    DATABASE_RECORD_SNAPSHOT_REFRESH_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const activeWorkspaces = await this.workspaceRepository.find({
      select: { id: true },
      where: {
        activationStatus: WorkspaceActivationStatus.ACTIVE,
      },
    });

    for (const activeWorkspace of activeWorkspaces) {
      try {
        const isIntegrationEnabled =
          await this.featureFlagService.isFeatureEnabled(
            FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED,
            activeWorkspace.id,
          );

        if (!isIntegrationEnabled) {
          continue;
        }

        await this.messageQueueService.add<DatabaseRecordSnapshotRefreshJobData>(
          DatabaseRecordSnapshotRefreshJob.name,
          { workspaceId: activeWorkspace.id },
        );
      } catch (error) {
        this.exceptionHandlerService.captureExceptions([error], {
          workspace: {
            id: activeWorkspace.id,
          },
        });
      }
    }
  }
}
