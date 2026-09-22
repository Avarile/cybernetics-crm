import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Any, In, Repository } from 'typeorm';

import {
  CalendarChannelSyncStage,
  CalendarChannelSyncStatus,
} from 'twenty-shared/types';
import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { MetricsKeys } from 'src/engine/core-modules/metrics/types/metrics-keys.type';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { AccountsToReconnectService } from 'src/modules/connected-account/services/accounts-to-reconnect.service';
import { AccountsToReconnectKeys } from 'src/modules/connected-account/types/accounts-to-reconnect-key-value.type';
// Central place for transitioning a calendar channel's sync stage/status
// (pending/ongoing/completed/failed) and related bookkeeping (cache, metrics,
// reconnect prompts) as it moves through the sync pipeline.
@Injectable()
export class CalendarChannelSyncStatusService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectCacheStorage(CacheStorageNamespace.ModuleCalendar)
    private readonly cacheStorage: CacheStorageService,
    @InjectRepository(CalendarChannelEntity)
    private readonly calendarChannelRepository: Repository<CalendarChannelEntity>,
    @InjectRepository(ConnectedAccountEntity)
    private readonly connectedAccountRepository: Repository<ConnectedAccountEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    private readonly accountsToReconnectService: AccountsToReconnectService,
    private readonly metricsService: MetricsService,
  ) {}

  // Marks channels ready for their next event list fetch.
  public async markAsCalendarEventListFetchPending(
    calendarChannelIds: string[],
    workspaceId: string,
    preserveSyncStageStartedAt: boolean = false,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.calendarChannelRepository.update(
          { id: In(calendarChannelIds), workspaceId },
          {
            syncStage:
              CalendarChannelSyncStage.CALENDAR_EVENT_LIST_FETCH_PENDING,
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

  // Marks channels as actively fetching their event list.
  public async markAsCalendarEventListFetchOngoing(
    calendarChannelIds: string[],
    workspaceId: string,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.calendarChannelRepository.update(
          { id: In(calendarChannelIds), workspaceId },
          {
            syncStage:
              CalendarChannelSyncStage.CALENDAR_EVENT_LIST_FETCH_ONGOING,
            syncStatus: CalendarChannelSyncStatus.ONGOING,
            syncStageStartedAt: new Date().toISOString(),
          },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Clears the sync cursor/throttle state and cached pending events, forcing
  // a full re-sync starting from a fresh event list fetch.
  public async resetAndMarkAsCalendarEventListFetchPending(
    calendarChannelIds: string[],
    workspaceId: string,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    for (const calendarChannelId of calendarChannelIds) {
      await this.cacheStorage.del(
        `calendar-events-to-import:${workspaceId}:${calendarChannelId}`,
      );
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.calendarChannelRepository.update(
          { id: In(calendarChannelIds), workspaceId },
          {
            syncCursor: '',
            syncStageStartedAt: null,
            throttleFailureCount: 0,
          },
        );
      },
      authContext,
      { lite: true },
    );

    await this.markAsCalendarEventListFetchPending(
      calendarChannelIds,
      workspaceId,
    );
  }

  // Clears the sync stage start timestamp (used when unsticking a stale sync).
  public async resetSyncStageStartedAt(
    calendarChannelIds: string[],
    workspaceId: string,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.calendarChannelRepository.update(
          { id: In(calendarChannelIds), workspaceId },
          {
            syncStageStartedAt: null,
          },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Marks channels ready for their next events import batch.
  public async markAsCalendarEventsImportPending(
    calendarChannelIds: string[],
    workspaceId: string,
    preserveSyncStageStartedAt: boolean = false,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.calendarChannelRepository.update(
          { id: In(calendarChannelIds), workspaceId },
          {
            syncStage: CalendarChannelSyncStage.CALENDAR_EVENTS_IMPORT_PENDING,
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

  // Marks channels as actively importing events.
  public async markAsCalendarEventsImportOngoing(
    calendarChannelIds: string[],
    workspaceId: string,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.calendarChannelRepository.update(
          { id: In(calendarChannelIds), workspaceId },
          {
            syncStage: CalendarChannelSyncStage.CALENDAR_EVENTS_IMPORT_ONGOING,
            syncStatus: CalendarChannelSyncStatus.ONGOING,
            syncStageStartedAt: new Date().toISOString(),
          },
        );
      },
      authContext,
      { lite: true },
    );
  }

  // Marks a full sync cycle complete: resets throttle/failure state, records
  // the synced timestamp, restarts at list-fetch-pending for the next cycle,
  // and increments the active-sync metric.
  public async markAsCalendarEventSyncCompleted(
    calendarChannelIds: string[],
    workspaceId: string,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.calendarChannelRepository.update(
          { id: In(calendarChannelIds), workspaceId },
          {
            syncStage:
              CalendarChannelSyncStage.CALENDAR_EVENT_LIST_FETCH_PENDING,
            syncStatus: CalendarChannelSyncStatus.ACTIVE,
            throttleFailureCount: 0,
            syncStageStartedAt: null,
            syncedAt: new Date().toISOString(),
          },
        );
      },
      authContext,
      { lite: true },
    );

    await this.markAsCalendarEventListFetchPending(
      calendarChannelIds,
      workspaceId,
    );

    await this.metricsService.incrementCounterForEvents({
      key: MetricsKeys.CalendarEventSyncJobActive,
      eventIds: calendarChannelIds,
    });
  }

  // Marks channels permanently failed (unknown cause) and drops their pending
  // import queue so a later resync starts clean.
  public async markAsFailedUnknownAndFlushCalendarEventsToImport(
    calendarChannelIds: string[],
    workspaceId: string,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    for (const calendarChannelId of calendarChannelIds) {
      await this.cacheStorage.del(
        `calendar-events-to-import:${workspaceId}:${calendarChannelId}`,
      );
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.calendarChannelRepository.update(
          { id: In(calendarChannelIds), workspaceId },
          {
            syncStatus: CalendarChannelSyncStatus.FAILED_UNKNOWN,
            syncStage: CalendarChannelSyncStage.FAILED,
          },
        );
      },
      authContext,
      { lite: true },
    );

    await this.metricsService.incrementCounterForEvents({
      key: MetricsKeys.CalendarEventSyncJobFailedUnknown,
      eventIds: calendarChannelIds,
    });
  }

  // Marks channels failed due to insufficient permissions, flags the
  // connected account as auth-failed, and queues it for reconnect prompting.
  public async markAsFailedInsufficientPermissionsAndFlushCalendarEventsToImport(
    calendarChannelIds: string[],
    workspaceId: string,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    for (const calendarChannelId of calendarChannelIds) {
      await this.cacheStorage.del(
        `calendar-events-to-import:${workspaceId}:${calendarChannelId}`,
      );
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        await this.calendarChannelRepository.update(
          { id: In(calendarChannelIds), workspaceId },
          {
            syncStatus:
              CalendarChannelSyncStatus.FAILED_INSUFFICIENT_PERMISSIONS,
            syncStage: CalendarChannelSyncStage.FAILED,
          },
        );

        const calendarChannels = await this.calendarChannelRepository.find({
          select: ['id', 'connectedAccountId'],
          where: { id: Any(calendarChannelIds), workspaceId },
        });

        const connectedAccountIds = calendarChannels.map(
          (calendarChannel) => calendarChannel.connectedAccountId,
        );

        await this.connectedAccountRepository.update(
          { id: Any(connectedAccountIds), workspaceId },
          {
            authFailedAt: new Date(),
          },
        );

        await this.addToAccountsToReconnect(
          calendarChannels.map((calendarChannel) => calendarChannel.id),
          workspaceId,
        );
      },
      authContext,
      { lite: true },
    );

    await this.metricsService.incrementCounterForEvents({
      key: MetricsKeys.CalendarEventSyncJobFailedInsufficientPermissions,
      eventIds: calendarChannelIds,
    });
  }

  // Resolves each channel's owning user and queues their connected account
  // to be surfaced for reconnection due to insufficient permissions.
  private async addToAccountsToReconnect(
    calendarChannelIds: string[],
    workspaceId: string,
  ) {
    if (!calendarChannelIds.length) {
      return;
    }

    const calendarChannels = await this.calendarChannelRepository.find({
      select: ['id', 'connectedAccountId'],
      where: {
        id: Any(calendarChannelIds),
        workspaceId,
      },
    });

    for (const calendarChannel of calendarChannels) {
      const connectedAccount = await this.connectedAccountRepository.findOne({
        where: { id: calendarChannel.connectedAccountId, workspaceId },
      });

      if (!connectedAccount) {
        continue;
      }

      const userWorkspace = await this.userWorkspaceRepository.findOne({
        where: { id: connectedAccount.userWorkspaceId },
        select: ['userId'],
      });

      if (!userWorkspace) {
        continue;
      }

      const userId = userWorkspace.userId;
      const connectedAccountId = connectedAccount.id;

      await this.accountsToReconnectService.addAccountToReconnectByKey(
        AccountsToReconnectKeys.ACCOUNTS_TO_RECONNECT_INSUFFICIENT_PERMISSIONS,
        userId,
        workspaceId,
        connectedAccountId,
      );
    }
  }
}
