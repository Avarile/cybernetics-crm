// Transitions a message channel's sync status/stage through the import
// pipeline (fetch pending -> scheduled -> ongoing -> import pending ->
// ongoing -> completed, or failed), emitting metrics and flagging
// connected accounts for reconnection when sync fails due to insufficient
// permissions.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Any, In, Repository } from 'typeorm';

import {
  MessageChannelPendingGroupEmailsAction,
  MessageChannelSyncStage,
  MessageChannelSyncStatus,
  MessageFolderPendingSyncAction,
} from 'twenty-shared/types';
import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { MetricsKeys } from 'src/engine/core-modules/metrics/types/metrics-keys.type';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { AccountsToReconnectService } from 'src/modules/connected-account/services/accounts-to-reconnect.service';
import { AccountsToReconnectKeys } from 'src/modules/connected-account/types/accounts-to-reconnect-key-value.type';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

@Injectable()
export class MessageChannelSyncStatusService {
  constructor(
    @InjectCacheStorage(CacheStorageNamespace.ModuleMessaging)
    private readonly cacheStorage: CacheStorageService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectRepository(MessageChannelEntity)
    private readonly messageChannelRepository: Repository<MessageChannelEntity>,
    @InjectRepository(MessageFolderEntity)
    private readonly messageFolderRepository: Repository<MessageFolderEntity>,
    @InjectRepository(ConnectedAccountEntity)
    private readonly connectedAccountRepository: Repository<ConnectedAccountEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    private readonly accountsToReconnectService: AccountsToReconnectService,
    private readonly metricsService: MetricsService,
  ) {}

  // Marks the given message channels as due for a fresh message list fetch.
  public async markAsMessagesListFetchPending(
    messageChannelIds: string[],
    workspaceId: string,
    preserveSyncStageStartedAt: boolean = false,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          {
            syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING,
            ...(!preserveSyncStageStartedAt
              ? { syncStageStartedAt: null }
              : {}),
          },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Marks the given message channels as due to have their fetched messages
  // imported.
  public async markAsMessagesImportPending(
    messageChannelIds: string[],
    workspaceId: string,
    preserveSyncStageStartedAt: boolean = false,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          {
            syncStage: MessageChannelSyncStage.MESSAGES_IMPORT_PENDING,
            ...(!preserveSyncStageStartedAt
              ? { syncStageStartedAt: null }
              : {}),
          },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Clears cached pending-import data and cursors on the channels and their
  // folders, then re-marks them as pending a full message list fetch —
  // used to force a clean resync (e.g. after a blocklist item is removed).
  public async resetAndMarkAsMessagesListFetchPending(
    messageChannelIds: string[],
    workspaceId: string,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    for (const messageChannelId of messageChannelIds) {
      await this.cacheStorage.del(
        `messages-to-import:${workspaceId}:${messageChannelId}`,
      );
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          {
            syncCursor: '',
            syncStageStartedAt: null,
            throttleFailureCount: 0,
            throttleRetryAfter: null,
            pendingGroupEmailsAction:
              MessageChannelPendingGroupEmailsAction.NONE,
          },
        );

        await this.messageFolderRepository.update(
          { messageChannelId: In(messageChannelIds), workspaceId },
          {
            syncCursor: '',
            pendingSyncAction: MessageFolderPendingSyncAction.NONE,
          },
        );
      },
      authContext,
      { lite: true },
    );

    await this.markAsMessagesListFetchPending(messageChannelIds, workspaceId);
  }

  // Clears the sync stage start timestamp without changing sync stage/status.
  public async resetSyncStageStartedAt(
    messageChannelIds: string[],
    workspaceId: string,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          { syncStageStartedAt: null },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Marks channels as having their message list fetch scheduled/ongoing.
  public async markAsMessagesListFetchScheduled(
    messageChannelIds: string[],
    workspaceId: string,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          {
            syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_SCHEDULED,
            syncStatus: MessageChannelSyncStatus.ONGOING,
            syncStageStartedAt: new Date().toISOString(),
          },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Marks channels as actively fetching their message list right now.
  public async markAsMessagesListFetchOngoing(
    messageChannelIds: string[],
    workspaceId: string,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          {
            syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_ONGOING,
            syncStatus: MessageChannelSyncStatus.ONGOING,
            syncStageStartedAt: new Date().toISOString(),
          },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Marks channels as actively synced, resets throttle state, and records
  // the sync completion metric.
  public async markAsMessageSyncCompleted(
    messageChannelIds: string[],
    workspaceId: string,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          {
            syncStatus: MessageChannelSyncStatus.ACTIVE,
            syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING,
            throttleFailureCount: 0,
            throttleRetryAfter: null,
            syncStageStartedAt: null,
            syncedAt: new Date().toISOString(),
          },
        );
      },
      authContext,
      { lite: true },
    );

    await this.metricsService.incrementCounterForEvents({
      key: MetricsKeys.MessageChannelSyncJobActive,
      eventIds: messageChannelIds,
    });
  }

  // Marks channels as having their message import scheduled.
  public async markAsMessagesImportScheduled(
    messageChannelIds: string[],
    workspaceId: string,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          {
            syncStage: MessageChannelSyncStage.MESSAGES_IMPORT_SCHEDULED,
          },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Marks channels as actively importing fetched messages right now.
  public async markAsMessagesImportOngoing(
    messageChannelIds: string[],
    workspaceId: string,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          {
            syncStage: MessageChannelSyncStage.MESSAGES_IMPORT_ONGOING,
            syncStatus: MessageChannelSyncStatus.ONGOING,
            syncStageStartedAt: new Date().toISOString(),
          },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Marks channels as failed with the given status, records the failure
  // metric, and — for insufficient-permissions failures — flags the
  // connected accounts as auth-failed and queues them for reconnection.
  public async markAsFailed(
    messageChannelIds: string[],
    workspaceId: string,
    syncStatus:
      | MessageChannelSyncStatus.FAILED_INSUFFICIENT_PERMISSIONS
      | MessageChannelSyncStatus.FAILED_UNKNOWN,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.messageChannelRepository.update(
          { id: In(messageChannelIds), workspaceId },
          {
            syncStage: MessageChannelSyncStage.FAILED,
            syncStatus: syncStatus,
            throttleRetryAfter: null,
          },
        );

        const metricsKey =
          syncStatus ===
          MessageChannelSyncStatus.FAILED_INSUFFICIENT_PERMISSIONS
            ? MetricsKeys.MessageChannelSyncJobFailedInsufficientPermissions
            : MetricsKeys.MessageChannelSyncJobFailedUnknown;

        await this.metricsService.incrementCounterForEvents({
          key: metricsKey,
          eventIds: messageChannelIds,
        });

        if (
          syncStatus ===
          MessageChannelSyncStatus.FAILED_INSUFFICIENT_PERMISSIONS
        ) {
          const messageChannels = await this.messageChannelRepository.find({
            where: { id: In(messageChannelIds), workspaceId },
          });

          const connectedAccountIds = messageChannels.map(
            (messageChannel) => messageChannel.connectedAccountId,
          );

          await this.connectedAccountRepository.update(
            { id: Any(connectedAccountIds), workspaceId },
            {
              authFailedAt: new Date(),
            },
          );

          await this.addToAccountsToReconnect(
            messageChannels.map((messageChannel) => messageChannel.id),
            workspaceId,
          );
        }
      },
      authContext,
      { lite: true },
    );
  }

  // Resolves each message channel to its owning workspace member and adds
  // them to the "accounts to reconnect" list surfaced to the user.
  private async addToAccountsToReconnect(
    messageChannelIds: string[],
    workspaceId: string,
  ) {
    if (!messageChannelIds.length) {
      return;
    }

    const messageChannels = await this.messageChannelRepository.find({
      where: { id: In(messageChannelIds), workspaceId },
    });

    const workspaceMemberRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
        workspaceId,
        'workspaceMember',
        { shouldBypassPermissionChecks: true },
      );

    for (const messageChannel of messageChannels) {
      const connectedAccount = await this.connectedAccountRepository.findOne({
        where: { id: messageChannel.connectedAccountId, workspaceId },
      });

      if (!connectedAccount) {
        continue;
      }

      const userWorkspace = await this.userWorkspaceRepository.findOne({
        where: { id: connectedAccount.userWorkspaceId },
      });

      if (!userWorkspace) {
        continue;
      }

      const workspaceMember = await workspaceMemberRepository.findOne({
        where: { userId: userWorkspace.userId },
      });

      if (!workspaceMember) {
        continue;
      }

      await this.accountsToReconnectService.addAccountToReconnectByKey(
        AccountsToReconnectKeys.ACCOUNTS_TO_RECONNECT_INSUFFICIENT_PERMISSIONS,
        workspaceMember.userId,
        workspaceId,
        connectedAccount.id,
      );
    }
  }
}
