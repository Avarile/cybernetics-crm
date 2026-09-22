// CLI command that registers the recurring cron job which checks for
// newer app versions on npm registries.
import { Command, CommandRunner } from 'nest-commander';

import { ApplicationVersionCheckCronJob } from 'src/engine/core-modules/application/application-upgrade/crons/application-version-check.cron.job';
import { APPLICATION_VERSION_CHECK_CRON_PATTERN } from 'src/engine/core-modules/application/application-upgrade/crons/constants/application-version-check-cron-pattern.constant';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

@Command({
  name: 'cron:app-version-check',
  description:
    'Starts a cron job to check for app version updates on npm registries',
})
export class ApplicationVersionCheckCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  // Registers the recurring app version check cron schedule.
  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: ApplicationVersionCheckCronJob.name,
      data: undefined,
      options: {
        repeat: {
          pattern: APPLICATION_VERSION_CHECK_CRON_PATTERN,
        },
      },
    });
  }
}
