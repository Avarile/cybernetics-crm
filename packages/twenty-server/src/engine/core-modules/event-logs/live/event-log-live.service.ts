// Tracks which workspace/table combinations have an active live subscriber
// (via short-TTL cache presence keys) and publishes new events only to those
// being watched, to avoid broadcasting unwatched workspace event data.
import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceEventEnvelope } from 'src/engine/core-modules/event-logs/types/workspace-event-envelope.type';
import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { EVENT_LOG_LIVE_TTL_MS } from 'src/engine/core-modules/event-logs/live/event-log-live-ttl.constant';
import { SubscriptionChannel } from 'src/engine/subscriptions/enums/subscription-channel.enum';
import { SubscriptionService } from 'src/engine/subscriptions/subscription.service';

type WatchedGroup = {
  workspaceId: string;
  table: string;
  rows: Record<string, unknown>[];
};

@Injectable()
export class EventLogLiveService {
  private readonly logger = new Logger(EventLogLiveService.name);

  constructor(
    @InjectCacheStorage(CacheStorageNamespace.EngineSubscriptions)
    private readonly cacheStorageService: CacheStorageService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // Builds the cache key tracking live-watch presence for a workspace/table.
  private getPresenceKey(workspaceId: string, key: string): string {
    return `workspaceEventLive:${workspaceId}:${key}`;
  }

  // Marks a workspace/table as actively watched, with a short TTL refreshed
  // by subscription heartbeats.
  async markWatched(workspaceId: string, key: string): Promise<void> {
    await this.cacheStorageService.set<boolean>(
      this.getPresenceKey(workspaceId, key),
      true,
      EVENT_LOG_LIVE_TTL_MS,
    );
  }

  // Checks whether a workspace/table currently has an active live watcher.
  async isWatched(workspaceId: string, key: string): Promise<boolean> {
    const value = await this.cacheStorageService.get<boolean>(
      this.getPresenceKey(workspaceId, key),
    );

    return isDefined(value);
  }

  // Groups events by workspace/table and publishes each group to the live
  // subscription channel only if that workspace/table is currently watched.
  async publishWatched(events: WorkspaceEventEnvelope[]): Promise<void> {
    const groups = new Map<string, WatchedGroup>();

    for (const event of events) {
      const workspaceId = event.row.workspaceId;

      if (!isDefined(workspaceId)) {
        continue;
      }

      const key = `${workspaceId}:${event.table}`;
      const group = groups.get(key) ?? {
        workspaceId,
        table: event.table,
        rows: [],
      };

      group.rows.push(event.row);
      groups.set(key, group);
    }

    const results = await Promise.allSettled(
      [...groups.values()].map(async ({ workspaceId, table, rows }) => {
        if (!(await this.isWatched(workspaceId, table))) {
          return;
        }

        await this.subscriptionService.publish({
          channel: SubscriptionChannel.WORKSPACE_EVENTS_CHANNEL,
          workspaceId,
          payload: { table, rows },
        });
      }),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error(
          'Failed to publish live workspace events',
          result.reason,
        );
      }
    }
  }
}
