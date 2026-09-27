import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  DATABASE_RECORD_SNAPSHOT_REFRESH_CRON_PATTERN,
  DatabaseRecordSnapshotRefreshCronJob,
} from 'src/modules/database-record/crons/jobs/database-record-snapshot-refresh.cron.job';

@Command({
  name: 'cron:database-centre:snapshot-refresh',
  description:
    'Starts a cron job to refresh stale data centre record snapshots',
})
// Registers the recurring cron job that refreshes data-centre snapshots.
export class DatabaseRecordSnapshotRefreshCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: DatabaseRecordSnapshotRefreshCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: DATABASE_RECORD_SNAPSHOT_REFRESH_CRON_PATTERN },
      },
    });
  }
}
