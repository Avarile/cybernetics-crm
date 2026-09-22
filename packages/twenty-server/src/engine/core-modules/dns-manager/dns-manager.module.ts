// NestJS module exposing DnsManagerService, which wraps Cloudflare's custom
// hostnames API for custom/public domain DNS validation.
import { Module } from '@nestjs/common';

import { DnsManagerService } from 'src/engine/core-modules/dns-manager/services/dns-manager.service';
import { DomainServerConfigModule } from 'src/engine/core-modules/domain/domain-server-config/domain-server-config.module';
@Module({
  imports: [DomainServerConfigModule],
  providers: [DnsManagerService],
  exports: [DnsManagerService],
})
export class DnsManagerModule {}
