import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { cleanSuspendedWorkspaceCronPattern } from 'src/engine/workspace-manager/workspace-cleaner/crons/clean-suspended-workspaces.cron.pattern';
import { CleanSuspendedWorkspacesJob } from 'src/engine/workspace-manager/workspace-cleaner/crons/clean-suspended-workspaces.job';

// CLI command that registers the recurring cron job cleaning suspended
// workspaces (run once at deploy/bootstrap time to schedule the repeat job).
@Command({
  name: 'cron:clean-suspended-workspaces',
  description: 'Starts a cron job to clean suspended workspaces',
})
export class CleanSuspendedWorkspacesCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  // Adds the repeating cron job to the queue.
  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: CleanSuspendedWorkspacesJob.name,
      data: undefined,
      options: {
        repeat: { pattern: cleanSuspendedWorkspaceCronPattern },
      },
    });
  }
}
