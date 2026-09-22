// NestJS module exposing SecureHttpClientService for SSRF-safe outbound HTTP.
import { Module } from '@nestjs/common';

import { SecureHttpClientService } from './secure-http-client.service';

@Module({
  providers: [SecureHttpClientService],
  exports: [SecureHttpClientService],
})
export class SecureHttpClientModule {}
