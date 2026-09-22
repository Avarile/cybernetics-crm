// NestJS module exposing the metrics-collection and metrics-caching services.
import { Module } from '@nestjs/common';

import { MetricsCacheService } from 'src/engine/core-modules/metrics/metrics-cache.service';
import { MetricsService } from 'src/engine/core-modules/metrics/metrics.service';

@Module({
  providers: [MetricsService, MetricsCacheService],
  exports: [MetricsService, MetricsCacheService],
})
export class MetricsModule {}
