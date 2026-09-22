// Runs a channel's pending group-email action (deleting previously-imported
// group-email messages, or resetting cursors to re-import them), queued
// when the workspace's excludeGroupEmails setting changes on a channel.
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { MessageChannelPendingGroupEmailsAction } from 'twenty-shared/types';
import { MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { MessagingDeleteGroupEmailMessagesService } from 'src/modules/messaging/message-import-manager/services/messaging-delete-group-email-messages.service';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';

@Injectable()
export class MessagingProcessGroupEmailActionsService {
  private readonly logger = new Logger(
    MessagingProcessGroupEmailActionsService.name,
  );

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectRepository(MessageChannelEntity)
    private readonly messageChannelRepository: Repository<MessageChannelEntity>,
    @InjectRepository(MessageFolderEntity)
    private readonly messageFolderRepository: Repository<MessageFolderEntity>,
    private readonly messagingDeleteGroupEmailMessagesService: MessagingDeleteGroupEmailMessagesService,
  ) {}

  // Queues a group-email action to run on the channel's next list fetch.
  async markMessageChannelAsPendingGroupEmailsAction(
    messageChannel: MessageChannelEntity,
    workspaceId: string,
    pendingGroupEmailsAction: MessageChannelPendingGroupEmailsAction,
  ): Promise<void> {
    await this.messageChannelRepository.update(
      { id: messageChannel.id, workspaceId },
      { pendingGroupEmailsAction },
    );

    this.logger.debug(
      `WorkspaceId: ${workspaceId}, MessageChannelId: ${messageChannel.id} - Marked message channel as pending group emails action: ${pendingGroupEmailsAction}`,
    );
  }

  // Runs the channel's pending group-email action, if any, and clears it
  // afterward; leaves the flag set (by rethrowing) on failure so it's
  // retried on the next sync.
  async processGroupEmailActions(
    messageChannel: MessageChannelEntity,
    workspaceId: string,
  ): Promise<void> {
    const { pendingGroupEmailsAction } = messageChannel;

    if (
      !isDefined(pendingGroupEmailsAction) ||
      pendingGroupEmailsAction === MessageChannelPendingGroupEmailsAction.NONE
    ) {
      return;
    }

    this.logger.debug(
      `WorkspaceId: ${workspaceId}, MessageChannelId: ${messageChannel.id} - Processing group email action: ${pendingGroupEmailsAction}`,
    );

    const authContext = buildSystemAuthContext(workspaceId);

    try {
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          switch (pendingGroupEmailsAction) {
            case MessageChannelPendingGroupEmailsAction.GROUP_EMAILS_DELETION:
              await this.handleGroupEmailsDeletion(
                workspaceId,
                messageChannel.id,
              );
              break;
            case MessageChannelPendingGroupEmailsAction.GROUP_EMAILS_IMPORT:
              await this.handleGroupEmailsImport(
                workspaceId,
                messageChannel.id,
              );
              break;
          }
        },
        authContext,
        { lite: true },
      );

      await this.messageChannelRepository.update(
        { id: messageChannel.id, workspaceId },
        {
          pendingGroupEmailsAction: MessageChannelPendingGroupEmailsAction.NONE,
        },
      );

      this.logger.debug(
        `WorkspaceId: ${workspaceId}, MessageChannelId: ${messageChannel.id} - Reset pendingGroupEmailsAction to NONE`,
      );
    } catch (error) {
      this.logger.error(
        `WorkspaceId: ${workspaceId}, MessageChannelId: ${messageChannel.id} - Error processing group email action: ${error.message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  // Deletes previously-imported group-email messages, then resets cursors
  // so a normal resync doesn't try to re-add them.
  private async handleGroupEmailsDeletion(
    workspaceId: string,
    messageChannelId: string,
  ): Promise<void> {
    await this.messagingDeleteGroupEmailMessagesService.deleteGroupEmailMessages(
      workspaceId,
      messageChannelId,
    );

    await this.resetCursors(workspaceId, messageChannelId);

    this.logger.debug(
      `WorkspaceId: ${workspaceId}, MessageChannelId: ${messageChannelId} - Completed GROUP_EMAILS_DELETION action`,
    );
  }

  // Resets cursors so the next full sync re-imports group-email messages.
  private async handleGroupEmailsImport(
    workspaceId: string,
    messageChannelId: string,
  ): Promise<void> {
    await this.resetCursors(workspaceId, messageChannelId);

    this.logger.debug(
      `WorkspaceId: ${workspaceId}, MessageChannelId: ${messageChannelId} - Completed GROUP_EMAILS_IMPORT action`,
    );
  }

  // Clears the channel's and its folders' sync cursors.
  private async resetCursors(workspaceId: string, messageChannelId: string) {
    await this.messageChannelRepository.update(
      { id: messageChannelId, workspaceId },
      { syncCursor: '' },
    );

    await this.messageFolderRepository.update(
      { messageChannelId, workspaceId },
      { syncCursor: '' },
    );
  }
}
