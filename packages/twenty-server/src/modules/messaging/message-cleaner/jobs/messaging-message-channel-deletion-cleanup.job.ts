// Runs after a message channel is deleted: removes its message channel
// message associations, then cleans up any orphaned messages/threads.
import { Logger, Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessagingMessageCleanerService } from 'src/modules/messaging/message-cleaner/services/messaging-message-cleaner.service';

export type MessagingMessageChannelDeletionCleanupJobData = {
  workspaceId: string;
  messageChannelId: string;
};

@Processor({
  queueName: MessageQueue.messagingQueue,
  scope: Scope.REQUEST,
})
export class MessagingMessageChannelDeletionCleanupJob {
  private readonly logger = new Logger(
    MessagingMessageChannelDeletionCleanupJob.name,
  );

  constructor(
    private readonly messageCleanerService: MessagingMessageCleanerService,
  ) {}

  // Deletes the channel's message associations, then cleans up orphans.
  @Process(MessagingMessageChannelDeletionCleanupJob.name)
  async handle(
    data: MessagingMessageChannelDeletionCleanupJobData,
  ): Promise<void> {
    this.logger.debug(
      `WorkspaceId: ${data.workspaceId} Cleaning up message channel message associations for channel ${data.messageChannelId}`,
    );

    await this.messageCleanerService.deleteMessageChannelMessageAssociationsByChannelId(
      {
        workspaceId: data.workspaceId,
        messageChannelId: data.messageChannelId,
      },
    );

    await this.messageCleanerService.cleanOrphanMessagesAndThreads(
      data.workspaceId,
    );
  }
}
