// Wraps OpenTelemetry metrics (observable gauges, counters, histograms)
// with convenience helpers, including a cached-gauge mode to avoid
// re-running expensive collection callbacks on every scrape.
import { Injectable, Logger } from '@nestjs/common';

import {
  metrics,
  type Attributes,
  type Meter,
  type MetricOptions,
  type ObservableGauge,
  type ObservableResult,
} from '@opentelemetry/api';
import { isDefined } from 'twenty-shared/utils';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { MetricsCacheService } from 'src/engine/core-modules/metrics/metrics-cache.service';
import { type MetricsKeys } from 'src/engine/core-modules/metrics/types/metrics-keys.type';

const METER_NAME = 'twenty-server';
const METRICS_CACHE_TTL = 60 * 1000; // 1 minute

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly metricsCacheService: MetricsCacheService,
    @InjectCacheStorage(CacheStorageNamespace.EngineHealth)
    private readonly healthCacheStorage: CacheStorageService,
  ) {}

  // Returns the shared OpenTelemetry meter for this app.
  getMeter(): Meter {
    return metrics.getMeter(METER_NAME);
  }

  // Registers a single-value observable gauge backed by `callback`.
  createObservableGauge({
    metricName,
    options,
    callback,
    cacheValue = false,
  }: {
    metricName: string;
    options: MetricOptions;
    callback: () => number | Promise<number>;
    cacheValue?: boolean;
  }): ObservableGauge {
    return this.createObservableGaugeInternal({
      metricName,
      options,
      callback,
      cacheValue,
      observeResult: (observableResult, result) => {
        observableResult.observe(result);
      },
    });
  }

  // Registers an observable gauge that emits multiple values (one per
  // attribute set) per collection, backed by `callback`.
  createMultiObservableGauge({
    metricName,
    options,
    callback,
    cacheValue = false,
  }: {
    metricName: string;
    options: MetricOptions;
    callback: () => Promise<Array<{ value: number; attributes: Attributes }>>;
    cacheValue?: boolean;
  }): ObservableGauge {
    return this.createObservableGaugeInternal({
      metricName,
      options,
      callback,
      cacheValue,
      observeResult: (observableResult, observations) => {
        for (const observation of observations) {
          observableResult.observe(observation.value, observation.attributes);
        }
      },
    });
  }

  // Shared gauge registration logic: on each scrape, optionally serves a
  // cached value instead of re-running `callback`, and caches fresh results
  // when `cacheValue` is set.
  private createObservableGaugeInternal<T>({
    metricName,
    options,
    callback,
    cacheValue,
    observeResult,
  }: {
    metricName: string;
    options: MetricOptions;
    callback: () => T | Promise<T>;
    cacheValue: boolean;
    observeResult: (observableResult: ObservableResult, result: T) => void;
  }): ObservableGauge {
    const gauge = this.getMeter().createObservableGauge(metricName, options);

    gauge.addCallback(async (observableResult) => {
      if (cacheValue) {
        const cachedResult = await this.healthCacheStorage.get<T>(metricName);

        if (isDefined(cachedResult)) {
          observeResult(observableResult, cachedResult);

          return;
        }
      }

      try {
        const result = await callback();

        observeResult(observableResult, result);

        if (cacheValue) {
          await this.healthCacheStorage.set(
            metricName,
            result,
            METRICS_CACHE_TTL,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to collect gauge metric ${metricName}`,
          error,
        );
      }
    });

    return gauge;
  }

  // Registers an "info" style gauge (always observes 1, carrying descriptive
  // attributes), auto-suffixing the metric name with `_info` if missing.
  createInfoGauge({
    metricName,
    options,
    attributesCallback,
  }: {
    metricName: string;
    options: MetricOptions;
    attributesCallback: () => Attributes | Promise<Attributes>;
  }): ObservableGauge {
    const normalizedName = metricName.endsWith('_info')
      ? metricName
      : `${metricName}_info`;

    const gauge = this.getMeter().createObservableGauge(
      normalizedName,
      options,
    );

    gauge.addCallback(async (observableResult) => {
      try {
        const attributes = await attributesCallback();

        observableResult.observe(1, attributes);
      } catch (error) {
        this.logger.error(
          `Failed to collect info gauge ${normalizedName}`,
          error,
        );
      }
    });

    return gauge;
  }

  // Increments an OTel counter by 1 and, optionally, records the event id
  // in the sliding-window cache for later count queries.
  async incrementCounterForEvent({
    key,
    eventId,
    attributes,
    shouldStoreInCache = true,
    debugLog,
  }: {
    key: MetricsKeys;
    eventId?: string;
    attributes?: Attributes;
    shouldStoreInCache?: boolean;
    debugLog?: string;
  }) {
    const counter = this.getMeter().createCounter(key);

    counter.add(1, attributes);

    if (shouldStoreInCache && eventId) {
      try {
        await this.metricsCacheService.updateCounter(key, [eventId]);
      } catch (error) {
        this.logger.error(`Failed to update metrics cache for ${key}`, error);
      }
    }

    if (isDefined(debugLog)) {
      this.logger.debug(debugLog);
    }
  }

  // Increments an OTel counter by the batch size and, optionally, records
  // each event id in the sliding-window cache.
  async incrementCounterForEvents({
    key,
    eventIds,
    attributes,
    shouldStoreInCache = true,
  }: {
    key: MetricsKeys;
    eventIds: string[];
    attributes?: Attributes;
    shouldStoreInCache?: boolean;
  }) {
    const counter = this.getMeter().createCounter(key);

    counter.add(eventIds.length, attributes);

    if (shouldStoreInCache) {
      await this.metricsCacheService.updateCounter(key, eventIds);
    }
  }

  // Increments an OTel counter by an arbitrary amount.
  incrementCounterBy({
    key,
    amount,
    attributes,
  }: {
    key: MetricsKeys;
    amount: number;
    attributes?: Attributes;
  }): void {
    this.getMeter().createCounter(key).add(amount, attributes);
  }

  // Records a value into an OTel histogram metric.
  recordHistogram({
    key,
    value,
    unit,
    attributes,
  }: {
    key: MetricsKeys;
    value: number;
    unit?: string;
    attributes?: Attributes;
  }): void {
    this.getMeter().createHistogram(key, { unit }).record(value, attributes);
  }

  // Computes sliding-window counts for a list of named metric cache keys,
  // returning them keyed by name (e.g. for a status-grouped dashboard).
  async groupMetrics(
    metrics: { name: string; cacheKey: MetricsKeys }[],
  ): Promise<Record<string, number>> {
    const groupedMetrics: Record<string, number> = {};

    const date = Date.now();

    for (const metric of metrics) {
      groupedMetrics[metric.name] = await this.metricsCacheService.computeCount(
        {
          key: metric.cacheKey,
          date,
        },
      );
    }

    return groupedMetrics;
  }
}
