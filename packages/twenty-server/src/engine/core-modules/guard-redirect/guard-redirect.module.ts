// NestJS module exposing GuardRedirectService, used by auth guards to
// redirect failed requests to a workspace-scoped error page.
import { Module } from '@nestjs/common';

import { DomainServerConfigModule } from 'src/engine/core-modules/domain/domain-server-config/domain-server-config.module';
import { WorkspaceDomainsModule } from 'src/engine/core-modules/domain/workspace-domains/workspace-domains.module';
import { GuardRedirectService } from 'src/engine/core-modules/guard-redirect/services/guard-redirect.service';

@Module({
  imports: [WorkspaceDomainsModule, DomainServerConfigModule],
  providers: [GuardRedirectService],
  exports: [GuardRedirectService],
})
export class GuardRedirectModule {}
