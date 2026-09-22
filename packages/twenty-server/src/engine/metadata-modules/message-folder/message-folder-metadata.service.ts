import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import {
  ConnectedAccountProvider,
  MessageFolderPendingSyncAction,
} from 'twenty-shared/types';

import { ConnectedAccountMetadataService } from 'src/engine/metadata-modules/connected-account/connected-account-metadata.service';
import { MessageFolderDTO } from 'src/engine/metadata-modules/message-folder/dtos/message-folder.dto';
import { MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';
import {
  MessageFolderException,
  MessageFolderExceptionCode,
} from 'src/engine/metadata-modules/message-folder/message-folder.exception';
import { MessageChannelMetadataService } from 'src/engine/metadata-modules/message-channel/message-channel-metadata.service';

// CRUD and sync-status operations for message folders, plus ownership checks that
// verify a folder's message channel belongs to the requesting user's connected accounts.
@Injectable()
export class MessageFolderMetadataService {
  constructor(
    @InjectRepository(MessageFolderEntity)
    private readonly repository: Repository<MessageFolderEntity>,
    private readonly messageChannelMetadataService: MessageChannelMetadataService,
    private readonly connectedAccountMetadataService: ConnectedAccountMetadataService,
  ) {}

  // Returns every message folder in the workspace, regardless of owner.
  async findAll(workspaceId: string): Promise<MessageFolderDTO[]> {
    return this.repository.find({ where: { workspaceId } });
  }

  // Returns all message folders across every message channel connected to the given user.
  async findByUserWorkspaceId({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<MessageFolderDTO[]> {
    const userAccountIds =
      await this.connectedAccountMetadataService.getUserConnectedAccountIds({
        userWorkspaceId,
        workspaceId,
      });

    const userChannels =
      await this.messageChannelMetadataService.findByConnectedAccountIds({
        connectedAccountIds: userAccountIds,
        workspaceId,
      });

    const userChannelIds = userChannels.map((channel) => channel.id);

    return this.findByMessageChannelIds({
      messageChannelIds: userChannelIds,
      workspaceId,
    });
  }

  // Returns a message channel's folders after verifying the channel belongs to the user.
  async findByMessageChannelIdForUser({
    messageChannelId,
    userWorkspaceId,
    workspaceId,
  }: {
    messageChannelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<MessageFolderDTO[]> {
    await this.messageChannelMetadataService.verifyOwnership({
      id: messageChannelId,
      userWorkspaceId,
      workspaceId,
    });

    return this.findByMessageChannelId({ messageChannelId, workspaceId });
  }

  // Returns all folders belonging to a single message channel.
  async findByMessageChannelId({
    messageChannelId,
    workspaceId,
  }: {
    messageChannelId: string;
    workspaceId: string;
  }): Promise<MessageFolderDTO[]> {
    return this.repository.find({
      where: { messageChannelId, workspaceId },
    });
  }

  // Returns all folders belonging to any of the given message channels.
  async findByMessageChannelIds({
    messageChannelIds,
    workspaceId,
  }: {
    messageChannelIds: string[];
    workspaceId: string;
  }): Promise<MessageFolderDTO[]> {
    if (messageChannelIds.length === 0) {
      return [];
    }

    return this.repository.find({
      where: { messageChannelId: In(messageChannelIds), workspaceId },
    });
  }

  // Returns a single message folder by id, or null if not found.
  async findById({
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  }): Promise<MessageFolderDTO | null> {
    return this.repository.findOne({ where: { id, workspaceId } });
  }

  // Asserts the folder exists and its message channel's connected account belongs to the
  // given user workspace, throwing a MessageFolderException otherwise.
  async verifyOwnership({
    id,
    userWorkspaceId,
    workspaceId,
  }: {
    id: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<MessageFolderEntity> {
    const messageFolder = await this.repository.findOne({
      where: { id, workspaceId },
    });

    if (!messageFolder) {
      throw new MessageFolderException(
        `Message folder ${id} not found`,
        MessageFolderExceptionCode.MESSAGE_FOLDER_NOT_FOUND,
      );
    }

    const userAccountIds =
      await this.connectedAccountMetadataService.getUserConnectedAccountIds({
        userWorkspaceId,
        workspaceId,
      });

    const messageChannel = await this.messageChannelMetadataService.findById({
      id: messageFolder.messageChannelId,
      workspaceId,
    });

    if (
      !messageChannel ||
      !userAccountIds.includes(messageChannel.connectedAccountId)
    ) {
      throw new MessageFolderException(
        `Message folder ${id} does not belong to user workspace ${userWorkspaceId}`,
        MessageFolderExceptionCode.MESSAGE_FOLDER_OWNERSHIP_VIOLATION,
      );
    }

    return messageFolder;
  }

  // Creates a new message folder.
  async create(
    data: Partial<MessageFolderEntity> & {
      workspaceId: string;
      messageChannelId: string;
      pendingSyncAction: MessageFolderPendingSyncAction;
    },
  ): Promise<MessageFolderDTO> {
    const entity = this.repository.create(data);

    return this.repository.save(entity);
  }

  // Updates a message folder's fields and returns the refreshed record.
  async update({
    id,
    workspaceId,
    data,
  }: {
    id: string;
    workspaceId: string;
    data: Partial<MessageFolderEntity>;
  }): Promise<MessageFolderDTO> {
    await this.repository.update(
      { id, workspaceId },
      data as Record<string, unknown>,
    );

    return this.repository.findOneOrFail({ where: { id, workspaceId } });
  }

  // Toggles sync on/off for the given folders. Turning sync off also clears any pending
  // FOLDER_IMPORT action. Turning sync on backfills a FOLDER_IMPORT action for
  // previously-unsynced Google folders so their messages get imported.
  async setSyncStatus({
    ids,
    workspaceId,
    data,
  }: {
    ids: string[];
    workspaceId: string;
    data: Partial<MessageFolderEntity>;
  }): Promise<MessageFolderDTO[]> {
    await this.repository.manager.transaction(async (manager) => {
      if (!data.isSynced) {
        await manager.update(
          MessageFolderEntity,
          { id: In(ids), workspaceId },
          { isSynced: false },
        );
        await manager.update(
          MessageFolderEntity,
          {
            id: In(ids),
            workspaceId,
            pendingSyncAction: MessageFolderPendingSyncAction.FOLDER_IMPORT,
          },
          { pendingSyncAction: MessageFolderPendingSyncAction.NONE },
        );

        return;
      }

      const folderIdsToBackfill = (
        await manager.find(MessageFolderEntity, {
          where: {
            id: In(ids),
            workspaceId,
            isSynced: false,
            messageChannel: {
              connectedAccount: { provider: ConnectedAccountProvider.GOOGLE },
            },
          },
        })
      ).map((folder) => folder.id);

      await manager.update(
        MessageFolderEntity,
        { id: In(ids), workspaceId },
        { isSynced: true },
      );

      if (folderIdsToBackfill.length > 0) {
        await manager.update(
          MessageFolderEntity,
          { id: In(folderIdsToBackfill), workspaceId },
          { pendingSyncAction: MessageFolderPendingSyncAction.FOLDER_IMPORT },
        );
      }
    });

    return this.repository.find({ where: { id: In(ids), workspaceId } });
  }

  // Deletes a message folder and returns the record as it existed before deletion.
  async delete({
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  }): Promise<MessageFolderDTO> {
    const messageFolder = await this.repository.findOneOrFail({
      where: { id, workspaceId },
    });

    await this.repository.delete({ id, workspaceId });

    return messageFolder;
  }
}
