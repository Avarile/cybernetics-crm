// Service preventing the same cron pattern from being dispatched more than
// once per scheduled tick across multiple server instances, using a Redis
// lock keyed by the pattern's last trigger timestamp.
import { Injectable } from '@nestjs/common';

import { CronExpressionParser } from 'cron-parser';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';

const ROOT_CRON_INTERVAL_MS = 60_000;
const CRON_DISPATCH_DEDUP_TTL_MS = 2 * 60_000;

@Injectable()
export class CronTriggerDeduplicationService {
  constructor(
    @InjectCacheStorage(CacheStorageNamespace.EngineLock)
    private readonly cacheStorageService: CacheStorageService,
  ) {}

  // Returns true (and claims a dedup lock) only if `pattern` was due within
  // the current root cron tick and no other instance has already claimed it.
  async shouldDispatch(
    keyPrefix: string,
    pattern: string,
    now: Date,
  ): Promise<boolean> {
    let lastTriggerTimestamp: number;

    try {
      lastTriggerTimestamp = CronExpressionParser.parse(pattern, {
        currentDate: now,
      })
        .prev()
        .getTime();
    } catch {
      return false;
    }

    const isDueWithinThisTick =
      now.getTime() - lastTriggerTimestamp < ROOT_CRON_INTERVAL_MS;

    if (!isDueWithinThisTick) {
      return false;
    }

    const dedupKey = `${keyPrefix}:${lastTriggerTimestamp}`;

    return this.cacheStorageService.acquireLock(
      dedupKey,
      CRON_DISPATCH_DEDUP_TTL_MS,
    );
  }
}
