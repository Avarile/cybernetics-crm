// Persists the next sync cursor after a successful fetch, on the channel
// (for cursor-per-channel providers) or a specific folder (for
// per-folder cursors like IMAP), and resets throttle state either way.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';

@Injectable()
export class MessagingCursorService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectRepository(MessageChannelEntity)
    private readonly messageChannelRepository: Repository<MessageChannelEntity>,
    @InjectRepository(MessageFolderEntity)
    private readonly messageFolderRepository: Repository<MessageFolderEntity>,
  ) {}

  // Without a folderId, updates the channel-level cursor (only advancing
  // it, never regressing); with a folderId, updates that folder's cursor
  // instead and clears the channel's throttle/sync-stage-started state.
  public async updateCursor(
    messageChannel: MessageChannelEntity,
    nextSyncCursor: string,
    workspaceId: string,
    folderId?: string,
  ) {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        if (!folderId) {
          await this.messageChannelRepository.update(
            { id: messageChannel.id, workspaceId },
            {
              throttleFailureCount: 0,
              throttleRetryAfter: null,
              syncStageStartedAt: null,
              syncCursor:
                !messageChannel.syncCursor ||
                nextSyncCursor > messageChannel.syncCursor
                  ? nextSyncCursor
                  : messageChannel.syncCursor,
            },
          );
        } else {
          await this.messageFolderRepository.update(
            { id: folderId, workspaceId },
            {
              syncCursor: nextSyncCursor,
            },
          );
          await this.messageChannelRepository.update(
            { id: messageChannel.id, workspaceId },
            {
              throttleFailureCount: 0,
              throttleRetryAfter: null,
              syncStageStartedAt: null,
            },
          );
        }
      },
      authContext,
      { lite: true },
    );
  }
}
