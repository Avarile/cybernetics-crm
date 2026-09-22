// NestJS module exposing ThrottlerService, a Redis-backed token-bucket rate limiter.
import { Module } from '@nestjs/common';

import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';

@Module({
  imports: [],
  providers: [ThrottlerService],
  exports: [ThrottlerService],
})
export class ThrottlerModule {}
