// NestJS module exposing CronTriggerDeduplicationService for coordinating
// cron dispatch across multiple server instances.
import { Module } from '@nestjs/common';

import { CronTriggerDeduplicationService } from 'src/engine/core-modules/cron/services/cron-trigger-deduplication.service';

@Module({
  providers: [CronTriggerDeduplicationService],
  exports: [CronTriggerDeduplicationService],
})
export class CronModule {}
