import { randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { In, Repository } from 'typeorm';

import {
  ConnectedAccountProvider,
  MessageChannelContactAutoCreationPolicy,
  MessageChannelPendingGroupEmailsAction,
  MessageChannelSyncStage,
  MessageChannelSyncStatus,
  MessageChannelType,
  MessageChannelVisibility,
} from 'twenty-shared/types';

import { EmailingDomainDriver } from 'src/engine/core-modules/emailing-domain/drivers/types/emailing-domain-driver.type';
import { EmailingDomainService } from 'src/engine/core-modules/emailing-domain/services/emailing-domain.service';
import { StorageDriverType } from 'src/engine/core-modules/file-storage/interfaces/file-storage.interface';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { ConnectedAccountMetadataService } from 'src/engine/metadata-modules/connected-account/connected-account-metadata.service';
import { MESSAGE_CHANNEL_DELETED_EVENT } from 'src/engine/metadata-modules/message-channel/constants/message-channel-deleted.constant';
import { CreateEmailGroupChannelOutput } from 'src/engine/metadata-modules/message-channel/dtos/create-email-group-channel.output';
import { MessageChannelDTO } from 'src/engine/metadata-modules/message-channel/dtos/message-channel.dto';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import {
  MessageChannelException,
  MessageChannelExceptionCode,
} from 'src/engine/metadata-modules/message-channel/message-channel.exception';
import { type MessageChannelDeletedEvent } from 'src/engine/metadata-modules/message-channel/types/message-channel-deleted.type';
import { WorkspaceEventEmitter } from 'src/engine/workspace-event-emitter/workspace-event-emitter';
import { INBOUND_EMAIL_LOCAL_PART_PREFIX } from 'src/modules/messaging/message-import-manager/drivers/inbound-email/constants/inbound-email-local-part-prefix.constant';
import { INBOUND_EMAIL_LOCAL_PART_RANDOM_BYTES } from 'src/modules/messaging/message-import-manager/drivers/inbound-email/constants/inbound-email-local-part-random-bytes.constant';
import { getDomainFromEmail } from 'src/utils/get-domain-from-email';

@Injectable()
// CRUD and lifecycle management for message channels (individual mailbox
// syncs and shared email-group inboxes), including ownership checks and
// email-group provisioning/teardown (forwarding address, emailing domain).
export class MessageChannelMetadataService {
  constructor(
    @InjectRepository(MessageChannelEntity)
    private readonly repository: Repository<MessageChannelEntity>,
    private readonly connectedAccountMetadataService: ConnectedAccountMetadataService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly emailingDomainService: EmailingDomainService,
    private readonly workspaceEventEmitter: WorkspaceEventEmitter,
  ) {}

  // Returns every message channel in the workspace.
  async findAll(workspaceId: string): Promise<MessageChannelDTO[]> {
    return this.repository.find({ where: { workspaceId } });
  }

  // Returns the message channels visible to a member: those on their own
  // connected accounts plus any shared workspace-wide accounts' channels.
  async findByUserWorkspaceId({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<MessageChannelDTO[]> {
    const userAccountIds =
      await this.connectedAccountMetadataService.getUserConnectedAccountIds({
        userWorkspaceId,
        workspaceId,
      });

    const sharedAccountIds =
      await this.connectedAccountMetadataService.getWorkspaceSharedConnectedAccountIds(
        { workspaceId },
      );

    return this.findByConnectedAccountIds({
      connectedAccountIds: [
        ...new Set([...userAccountIds, ...sharedAccountIds]),
      ],
      workspaceId,
    });
  }

  // Returns the message channels for a connected account, after verifying
  // the member has access to that account.
  async findByConnectedAccountIdForUser({
    connectedAccountId,
    userWorkspaceId,
    workspaceId,
  }: {
    connectedAccountId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<MessageChannelDTO[]> {
    await this.connectedAccountMetadataService.verifyOwnership({
      id: connectedAccountId,
      userWorkspaceId,
      workspaceId,
    });

    return this.findByConnectedAccountId({ connectedAccountId, workspaceId });
  }

  // Returns the message channels belonging to a single connected account.
  async findByConnectedAccountId({
    connectedAccountId,
    workspaceId,
  }: {
    connectedAccountId: string;
    workspaceId: string;
  }): Promise<MessageChannelDTO[]> {
    return this.repository.find({
      where: { connectedAccountId, workspaceId },
    });
  }

  // Returns the message channels belonging to any of several connected
  // accounts.
  async findByConnectedAccountIds({
    connectedAccountIds,
    workspaceId,
  }: {
    connectedAccountIds: string[];
    workspaceId: string;
  }): Promise<MessageChannelDTO[]> {
    if (connectedAccountIds.length === 0) {
      return [];
    }

    return this.repository.find({
      where: { connectedAccountId: In(connectedAccountIds), workspaceId },
    });
  }

  // Finds a message channel by id within a workspace.
  async findById({
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  }): Promise<MessageChannelDTO | null> {
    return this.repository.findOne({ where: { id, workspaceId } });
  }

  // Loads a message channel and throws unless it exists and is either on
  // a workspace-shared connected account or owned by the given member.
  async verifyOwnership({
    id,
    userWorkspaceId,
    workspaceId,
  }: {
    id: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<MessageChannelEntity> {
    const messageChannel = await this.repository.findOne({
      where: { id, workspaceId },
    });

    if (!messageChannel) {
      throw new MessageChannelException(
        `Message channel ${id} not found`,
        MessageChannelExceptionCode.MESSAGE_CHANNEL_NOT_FOUND,
      );
    }

    const connectedAccount =
      await this.connectedAccountMetadataService.findById({
        id: messageChannel.connectedAccountId,
        workspaceId,
      });

    if (connectedAccount?.visibility === 'workspace') {
      return messageChannel;
    }

    const userAccountIds =
      await this.connectedAccountMetadataService.getUserConnectedAccountIds({
        userWorkspaceId,
        workspaceId,
      });

    if (!userAccountIds.includes(messageChannel.connectedAccountId)) {
      throw new MessageChannelException(
        `Message channel ${id} does not belong to user workspace ${userWorkspaceId}`,
        MessageChannelExceptionCode.MESSAGE_CHANNEL_OWNERSHIP_VIOLATION,
      );
    }

    return messageChannel;
  }

  // Persists a new message channel record.
  async create(
    data: Partial<MessageChannelEntity> & {
      workspaceId: string;
      handle: string;
      connectedAccountId: string;
      visibility: MessageChannelVisibility;
      type: MessageChannelType;
      syncStage: MessageChannelSyncStage;
    },
  ): Promise<MessageChannelDTO> {
    const entity = this.repository.create(data);

    return this.repository.save(entity);
  }

  // Applies a partial update to a message channel.
  async update({
    id,
    workspaceId,
    data,
  }: {
    id: string;
    workspaceId: string;
    data: Partial<MessageChannelEntity>;
  }): Promise<MessageChannelDTO> {
    await this.repository.update(
      { id, workspaceId },
      data as Record<string, unknown>,
    );

    return this.repository.findOneOrFail({ where: { id, workspaceId } });
  }

  // Provisions a shared email-group inbox: validates the server is
  // configured for inbound email (or running in emailing-domain demo
  // mode), registers the sending domain, generates a unique inbound
  // forwarding address, and creates the backing connected account and
  // message channel configured for send-and-receive contact auto-creation.
  async createEmailGroupChannel({
    handle,
    userWorkspaceId,
    workspaceId,
  }: {
    handle: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<CreateEmailGroupChannelOutput> {
    const inboundEmailDomain = this.twentyConfigService.get(
      'INBOUND_EMAIL_DOMAIN',
    );
    const storageType = this.twentyConfigService.get('STORAGE_TYPE');
    const isEmailingDomainInDemoMode =
      this.twentyConfigService.get('EMAILING_DOMAIN_DRIVER') ===
      EmailingDomainDriver.LOG;

    if (
      !isEmailingDomainInDemoMode &&
      (!isNonEmptyString(inboundEmailDomain) ||
        storageType !== StorageDriverType.S_3)
    ) {
      throw new MessageChannelException(
        'Email handles are not configured: INBOUND_EMAIL_DOMAIN must be set and STORAGE_TYPE must be S3',
        MessageChannelExceptionCode.EMAIL_GROUP_NOT_CONFIGURED,
      );
    }

    const sendDomain = getDomainFromEmail(handle)?.toLowerCase();

    if (isNonEmptyString(sendDomain)) {
      await this.emailingDomainService.ensureEmailingDomain(
        sendDomain,
        workspaceId,
      );
    }

    const localPart =
      INBOUND_EMAIL_LOCAL_PART_PREFIX +
      randomBytes(INBOUND_EMAIL_LOCAL_PART_RANDOM_BYTES).toString('hex');

    const forwardingDomain = isNonEmptyString(inboundEmailDomain)
      ? inboundEmailDomain
      : 'demo.invalid';

    const forwardingAddress = `${localPart}@${forwardingDomain}`;

    const connectedAccount = await this.connectedAccountMetadataService.create({
      workspaceId,
      handle,
      provider: ConnectedAccountProvider.EMAIL_GROUP,
      userWorkspaceId,
      accessToken: null,
      refreshToken: null,
      visibility: 'workspace',
    });

    const messageChannel = await this.create({
      workspaceId,
      handle: forwardingAddress,
      connectedAccountId: connectedAccount.id,
      type: MessageChannelType.EMAIL_GROUP,
      visibility: MessageChannelVisibility.SHARE_EVERYTHING,
      syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING,
      syncStatus: MessageChannelSyncStatus.ACTIVE,
      isSyncEnabled: true,
      isContactAutoCreationEnabled: true,
      contactAutoCreationPolicy:
        MessageChannelContactAutoCreationPolicy.SENT_AND_RECEIVED,
      excludeGroupEmails: false,
      excludeNonProfessionalEmails: false,
      pendingGroupEmailsAction: MessageChannelPendingGroupEmailsAction.NONE,
    });

    return { messageChannel, forwardingAddress };
  }

  // Returns the existing email-group channel for a sender address, or
  // creates one if none exists yet (e.g. on first inbound message to a
  // new group address).
  async getOrCreateEmailGroupChannel({
    fromAddress,
    userWorkspaceId,
    workspaceId,
  }: {
    fromAddress: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<MessageChannelDTO> {
    const existingChannel = await this.repository.findOne({
      where: {
        workspaceId,
        type: MessageChannelType.EMAIL_GROUP,
        connectedAccount: { handle: fromAddress },
      },
    });

    if (existingChannel) {
      return existingChannel;
    }

    const { messageChannel } = await this.createEmailGroupChannel({
      handle: fromAddress,
      userWorkspaceId,
      workspaceId,
    });

    return messageChannel;
  }

  // Deletes a message channel and emits a deletion event for dependent
  // modules to clean up.
  async delete({
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  }): Promise<MessageChannelDTO> {
    const messageChannel = await this.repository.findOneOrFail({
      where: { id, workspaceId },
    });

    await this.repository.delete({ id, workspaceId });

    this.workspaceEventEmitter.emitCustomBatchEvent<MessageChannelDeletedEvent>(
      MESSAGE_CHANNEL_DELETED_EVENT,
      [{ messageChannelId: id }],
      workspaceId,
    );

    return messageChannel;
  }

  // Tears down an email-group channel after verifying ownership: deletes
  // its backing connected account, then removes the emailing domain
  // registration if no other email-group channel still uses that domain.
  async deleteEmailGroupChannel({
    id,
    userWorkspaceId,
    workspaceId,
  }: {
    id: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<MessageChannelDTO> {
    const messageChannel = await this.verifyOwnership({
      id,
      userWorkspaceId,
      workspaceId,
    });

    if (messageChannel.type !== MessageChannelType.EMAIL_GROUP) {
      throw new MessageChannelException(
        `Message channel ${id} is not an email group`,
        MessageChannelExceptionCode.INVALID_MESSAGE_CHANNEL_INPUT,
      );
    }

    const connectedAccount =
      await this.connectedAccountMetadataService.findById({
        id: messageChannel.connectedAccountId,
        workspaceId,
      });
    const sendDomain = getDomainFromEmail(
      connectedAccount?.handle ?? '',
    )?.toLowerCase();

    await this.connectedAccountMetadataService.delete({
      id: messageChannel.connectedAccountId,
      workspaceId,
    });

    if (
      isNonEmptyString(sendDomain) &&
      !(await this.hasEmailGroupChannelForDomain(workspaceId, sendDomain))
    ) {
      await this.emailingDomainService.deleteEmailingDomainByDomainIfExists(
        workspaceId,
        sendDomain,
      );
    }

    return messageChannel;
  }

  // Checks whether any email-group channel in the workspace still uses
  // the given sending domain.
  private async hasEmailGroupChannelForDomain(
    workspaceId: string,
    domain: string,
  ): Promise<boolean> {
    const emailGroupChannels = await this.repository.find({
      where: { workspaceId, type: MessageChannelType.EMAIL_GROUP },
      relations: { connectedAccount: true },
    });

    return emailGroupChannels.some(
      (channel) =>
        isDefined(channel.connectedAccount) &&
        getDomainFromEmail(channel.connectedAccount.handle)?.toLowerCase() ===
          domain,
    );
  }
}
