// Runs after a connected account is deleted: cleans up any orphaned
// messages/threads left without a message channel association.
import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessagingMessageCleanerService } from 'src/modules/messaging/message-cleaner/services/messaging-message-cleaner.service';

export type MessagingConnectedAccountDeletionCleanupJobData = {
  workspaceId: string;
  connectedAccountId: string;
};

@Processor({
  queueName: MessageQueue.messagingQueue,
  scope: Scope.REQUEST,
})
export class MessagingConnectedAccountDeletionCleanupJob {
  constructor(
    private readonly messageCleanerService: MessagingMessageCleanerService,
  ) {}

  // Cleans up orphan messages and threads for the given workspace.
  @Process(MessagingConnectedAccountDeletionCleanupJob.name)
  async handle(
    data: MessagingConnectedAccountDeletionCleanupJobData,
  ): Promise<void> {
    await this.messageCleanerService.cleanOrphanMessagesAndThreads(
      data.workspaceId,
    );
  }
}
