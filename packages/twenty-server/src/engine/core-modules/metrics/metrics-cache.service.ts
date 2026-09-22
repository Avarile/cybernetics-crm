// Backs sliding-window event counting (e.g. sync job outcomes) by storing
// event ids into fixed 15s cache buckets and summing sets across the
// buckets covering a requested time window.
import { Injectable } from '@nestjs/common';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { type MetricsKeys } from 'src/engine/core-modules/metrics/types/metrics-keys.type';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const CACHE_BUCKET_DURATION_MS = 15000; // 15 seconds window for each cache bucket

@Injectable()
export class MetricsCacheService {
  private readonly healthMetricsTimeWindowInMinutes: number;
  private readonly healthCacheTtl: number;

  constructor(
    @InjectCacheStorage(CacheStorageNamespace.EngineMetrics)
    private readonly cacheStorage: CacheStorageService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {
    this.healthMetricsTimeWindowInMinutes = this.twentyConfigService.get(
      'HEALTH_METRICS_TIME_WINDOW_IN_MINUTES',
    );
    this.healthCacheTtl = this.healthMetricsTimeWindowInMinutes * 60000 * 2;
  }

  // Rounds a timestamp down to the start of its 15s bucket.
  private getCacheBucketStartTimestamp(timestamp: number): number {
    return (
      Math.floor(timestamp / CACHE_BUCKET_DURATION_MS) *
      CACHE_BUCKET_DURATION_MS
    );
  }

  // Builds the cache key for `key`'s bucket containing `timestamp` (or now).
  private getCacheKeyWithTimestamp(key: string, timestamp?: number): string {
    const currentIntervalTimestamp =
      timestamp ?? this.getCacheBucketStartTimestamp(Date.now());

    return `${key}:${currentIntervalTimestamp}`;
  }

  // Returns the start timestamps of the last N buckets ending at `date`.
  private getLastCacheBucketStartTimestampsFromDate(
    cacheBucketsCount: number,
    date: number,
  ): number[] {
    const currentIntervalTimestamp = this.getCacheBucketStartTimestamp(date);

    return Array.from(
      { length: cacheBucketsCount },
      (_, i) => currentIntervalTimestamp - i * CACHE_BUCKET_DURATION_MS,
    );
  }

  // Adds event ids to the current time bucket's set for `key`.
  async updateCounter(key: MetricsKeys, items: string[]) {
    return await this.cacheStorage.setAdd(
      this.getCacheKeyWithTimestamp(key),
      items,
      this.healthCacheTtl,
    );
  }

  // Sums the distinct event count for `key` across the buckets covering the
  // requested time window (which must be a multiple of the bucket duration).
  async computeCount({
    key,
    timeWindowInSeconds = this.healthMetricsTimeWindowInMinutes * 60,
    date = Date.now(),
  }: {
    key: MetricsKeys;
    timeWindowInSeconds?: number;
    date?: number;
  }): Promise<number> {
    if ((timeWindowInSeconds * 1000) % CACHE_BUCKET_DURATION_MS !== 0) {
      throw new Error(
        `Time window must be divisible by ${CACHE_BUCKET_DURATION_MS}`,
      );
    }

    const cacheBuckets =
      timeWindowInSeconds / (CACHE_BUCKET_DURATION_MS / 1000);

    const cacheKeys = this.computeTimeStampedCacheKeys(key, cacheBuckets, date);

    return await this.cacheStorage.countAllSetMembers(cacheKeys);
  }

  // Builds the list of bucket cache keys covering the requested window.
  computeTimeStampedCacheKeys(
    key: string,
    cacheBucketsCount: number,
    date: number,
  ) {
    return this.getLastCacheBucketStartTimestampsFromDate(
      cacheBucketsCount,
      date,
    ).map((timestamp) => this.getCacheKeyWithTimestamp(key, timestamp));
  }
}
