import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { buildUrlWithPathnameAndSearchParams } from 'src/engine/core-modules/domain/domain-server-config/utils/build-url-with-pathname-and-search-params.util';
import { WorkspaceDomainConfig } from 'src/engine/core-modules/domain/workspace-domains/types/workspace-domain-config.type';
import { PublicDomainEntity } from 'src/engine/core-modules/public-domain/public-domain.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';

// Resolves which workspace a request origin belongs to, and builds workspace/public
// function URLs from subdomain or custom domain
@Injectable()
export class WorkspaceDomainsService {
  constructor(
    private readonly domainServerConfigService: DomainServerConfigService,
    private readonly twentyConfigService: TwentyConfigService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    // Request routing resolves workspace via the public domain registry.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    @InjectRepository(PublicDomainEntity)
    private readonly publicDomainRepository: Repository<PublicDomainEntity>,
  ) {}

  // Builds a URL on the workspace's custom domain if enabled, otherwise its subdomain
  buildWorkspaceURL({
    workspace,
    pathname,
    searchParams,
    hash,
  }: {
    workspace: WorkspaceDomainConfig;
    pathname?: string;
    searchParams?: Record<string, string | number | boolean>;
    hash?: string;
  }) {
    const workspaceUrls = this.getWorkspaceUrls(workspace);

    const url = buildUrlWithPathnameAndSearchParams({
      baseUrl: new URL(workspaceUrls.customUrl ?? workspaceUrls.subdomainUrl),
      pathname,
      searchParams,
      hash,
    });

    return url;
  }

  // Builds a workspace URL carrying an errorMessage query param, for redirect flows
  computeWorkspaceRedirectErrorUrl(
    errorMessage: string,
    workspace: WorkspaceDomainConfig,
    pathname: string,
  ) {
    const url = this.buildWorkspaceURL({
      workspace,
      pathname,
      searchParams: { errorMessage },
    });

    return url.toString();
  }

  // In single-workspace mode, returns the one workspace to use, preferring the
  // seeded Apple workspace over the most recently created one if multiple exist
  private async getDefaultWorkspace() {
    if (this.twentyConfigService.get('IS_MULTIWORKSPACE_ENABLED')) {
      throw new Error(
        'Default workspace does not exist when multi-workspace is enabled',
      );
    }

    const workspaces = await this.workspaceRepository.find({
      order: {
        createdAt: 'DESC',
      },
      relations: ['workspaceSSOIdentityProviders'],
    });

    if (workspaces.length > 1) {
      Logger.warn(
        `${workspaces.length} workspaces found in database. In single-workspace mode, there should be only one workspace. The Apple seed workspace will be used as fallback if present.`,
      );
    }

    const foundWorkspace =
      workspaces.find(
        (workspace) => workspace.id === SEED_APPLE_WORKSPACE_ID,
      ) ?? workspaces[0];

    assertIsDefinedOrThrow(foundWorkspace, WorkspaceNotFoundDefaultError);

    return foundWorkspace;
  }

  // Resolves the workspace for a request origin, falling back to the single
  // default workspace when multi-workspace mode is off
  async getWorkspaceByOriginOrDefaultWorkspace(origin: string) {
    const { workspace } = await this.resolveWorkspaceAndPublicDomain(origin);

    return workspace;
  }

  // Classifies the origin (public function domain, custom domain, or subdomain)
  // and resolves the matching workspace and, if applicable, its public domain
  async resolveWorkspaceAndPublicDomain(origin: string): Promise<{
    workspace: WorkspaceEntity | undefined;
    publicDomain: PublicDomainEntity | null;
    isIsolatedOrigin: boolean;
  }> {
    const { subdomain, domain, isPublicDomainOrigin } =
      this.domainServerConfigService.getSubdomainAndDomainFromUrl(origin);

    if (!this.twentyConfigService.get('IS_MULTIWORKSPACE_ENABLED')) {
      // Single-workspace: workspace is always the default. Still resolve a
      // matching public domain so the route trigger can scope by application.
      const publicDomain = isDefined(domain)
        ? await this.publicDomainRepository.findOne({ where: { domain } })
        : null;

      return {
        workspace: await this.getDefaultWorkspace(),
        publicDomain: publicDomain ?? null,
        isIsolatedOrigin: isPublicDomainOrigin || isDefined(publicDomain),
      };
    }

    if (isPublicDomainOrigin) {
      const hostname = new URL(origin).hostname;

      const registeredPublicDomain = await this.publicDomainRepository.findOne({
        where: { domain: hostname },
        relations: ['workspace', 'workspace.workspaceSSOIdentityProviders'],
      });

      if (isDefined(registeredPublicDomain)) {
        return {
          workspace: registeredPublicDomain.workspace ?? undefined,
          publicDomain: registeredPublicDomain,
          isIsolatedOrigin: true,
        };
      }

      const workspaceFromSubdomain = isDefined(subdomain)
        ? ((await this.workspaceRepository.findOne({
            where: { subdomain },
            relations: ['workspaceSSOIdentityProviders'],
          })) ?? undefined)
        : undefined;

      return {
        workspace: workspaceFromSubdomain,
        publicDomain: null,
        isIsolatedOrigin: true,
      };
    }

    if (!domain && !subdomain) {
      return {
        workspace: undefined,
        publicDomain: null,
        isIsolatedOrigin: false,
      };
    }

    const where = isDefined(domain) ? { customDomain: domain } : { subdomain };

    const workspaceFromCustomDomainOrSubdomain =
      (await this.workspaceRepository.findOne({
        where,
        relations: ['workspaceSSOIdentityProviders'],
      })) ?? undefined;

    if (isDefined(workspaceFromCustomDomainOrSubdomain) || !isDefined(domain)) {
      return {
        workspace: workspaceFromCustomDomainOrSubdomain,
        publicDomain: null,
        isIsolatedOrigin: false,
      };
    }

    const publicDomain = await this.publicDomainRepository.findOne({
      where: { domain },
      relations: ['workspace', 'workspace.workspaceSSOIdentityProviders'],
    });

    return {
      workspace: publicDomain?.workspace ?? undefined,
      publicDomain: publicDomain ?? null,
      isIsolatedOrigin: isDefined(publicDomain),
    };
  }

  // Builds the base URL serverless functions are exposed under for a workspace,
  // preferring an explicit primary public domain over the subdomain-based default
  buildPublicFunctionBaseUrl({
    workspace,
    primaryPublicDomain,
  }: {
    workspace: Pick<WorkspaceEntity, 'subdomain'>;
    primaryPublicDomain?: string | null;
  }): string | undefined {
    if (isNonEmptyString(primaryPublicDomain)) {
      return `https://${primaryPublicDomain}`;
    }

    const publicBaseHostname =
      this.domainServerConfigService.getPublicBaseHostnameOrUndefined();

    if (!isNonEmptyString(publicBaseHostname)) {
      return undefined;
    }

    const url = this.domainServerConfigService.getPublicDomainUrl();

    url.hostname = `${workspace.subdomain}.${publicBaseHostname}`;

    return url.origin;
  }

  // Appends a path to the workspace's public function base URL
  buildPublicFunctionUrl({
    workspace,
    path,
  }: {
    workspace: Pick<WorkspaceEntity, 'subdomain'>;
    path: string;
  }): string | undefined {
    const baseUrl = this.buildPublicFunctionBaseUrl({ workspace });

    if (!isDefined(baseUrl)) {
      return undefined;
    }

    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  // Builds the workspace's front URL with the custom domain as hostname
  private getCustomWorkspaceUrl(customDomain: string) {
    const url = this.domainServerConfigService.getFrontUrl();

    url.hostname = customDomain;

    return url.toString();
  }

  // Builds the workspace's front URL with the subdomain prefixed, when multi-workspace is on
  private getTwentyWorkspaceUrl(subdomain: string) {
    const url = this.domainServerConfigService.getFrontUrl();

    url.hostname = this.twentyConfigService.get('IS_MULTIWORKSPACE_ENABLED')
      ? `${subdomain}.${url.hostname}`
      : url.hostname;

    return url.toString();
  }

  // Normalizes a workspace's domain config, falling back to the default subdomain
  // when there's no workspace or custom domain isn't enabled
  getSubdomainAndCustomDomainFromWorkspaceFallbackOnDefaultSubdomain(
    workspace?: WorkspaceDomainConfig | null,
  ) {
    if (!workspace) {
      return {
        subdomain: this.twentyConfigService.get('DEFAULT_SUBDOMAIN'),
        customDomain: null,
        isCustomDomainEnabled: false,
      };
    }

    if (!workspace.isCustomDomainEnabled) {
      return {
        subdomain: workspace.subdomain,
        customDomain: null,
        isCustomDomainEnabled: false,
      };
    }

    return workspace;
  }

  // Returns the workspace's subdomain URL, plus its custom domain URL if enabled
  getWorkspaceUrls({
    subdomain,
    customDomain,
    isCustomDomainEnabled,
  }: WorkspaceDomainConfig) {
    return {
      customUrl:
        isCustomDomainEnabled && customDomain
          ? this.getCustomWorkspaceUrl(customDomain)
          : undefined,
      subdomainUrl: this.getTwentyWorkspaceUrl(subdomain),
    };
  }

  // Looks up a workspace by its custom domain
  async findByCustomDomain(customDomain: string) {
    return this.workspaceRepository.findOne({ where: { customDomain } });
  }
}
