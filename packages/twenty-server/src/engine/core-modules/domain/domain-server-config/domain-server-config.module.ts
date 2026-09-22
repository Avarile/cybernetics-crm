import { Module } from '@nestjs/common';

import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';

// Wires up the service that resolves front-end/public-domain URLs from server config
@Module({
  imports: [],
  providers: [DomainServerConfigService],
  exports: [DomainServerConfigService],
})
export class DomainServerConfigModule {}
