// Service that re-checks DNS validation status for the workspace custom
// domain or public domain matching a hostname reported by Cloudflare.
import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { CustomDomainManagerService } from 'src/engine/core-modules/domain/custom-domain-manager/services/custom-domain-manager.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { PublicDomainService } from 'src/engine/core-modules/public-domain/public-domain.service';

@Injectable()
export class DnsCloudflareService {
  constructor(
    private readonly publicDomainService: PublicDomainService,
    private readonly customDomainManagerService: CustomDomainManagerService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
  ) {}

  // Looks up the hostname as a workspace custom domain and/or a public
  // domain, and re-validates DNS records for whichever match(es).
  async checkHostname(hostname: string) {
    const workspace =
      await this.workspaceDomainsService.findByCustomDomain(hostname);

    if (isDefined(workspace)) {
      await this.customDomainManagerService.checkCustomDomainValidRecords(
        workspace,
      );
    }

    const publicDomain = await this.publicDomainService.findByDomain(hostname);

    if (isDefined(publicDomain)) {
      await this.publicDomainService.checkPublicDomainValidRecords(
        publicDomain,
      );
    }
  }
}
