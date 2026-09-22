// GraphQL resolver for registering, listing, deleting, and re-validating a
// workspace's public domains.
import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { assertIsDefinedOrThrow } from 'twenty-shared/utils';
import { PermissionFlagType } from 'twenty-shared/constants';

import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { DomainValidRecords } from 'src/engine/core-modules/dns-manager/dtos/domain-valid-records';
import { DnsManagerService } from 'src/engine/core-modules/dns-manager/services/dns-manager.service';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { CreatePublicDomainInput } from 'src/engine/core-modules/public-domain/dtos/create-public-domain.input';
import { PublicDomainDTO } from 'src/engine/core-modules/public-domain/dtos/public-domain.dto';
import { PublicDomainInput } from 'src/engine/core-modules/public-domain/dtos/public-domain.input';
import { PublicDomainExceptionFilter } from 'src/engine/core-modules/public-domain/public-domain-exception-filter';
import { PublicDomainEntity } from 'src/engine/core-modules/public-domain/public-domain.entity';
import {
  PublicDomainException,
  PublicDomainExceptionCode,
} from 'src/engine/core-modules/public-domain/public-domain.exception';
import { PublicDomainService } from 'src/engine/core-modules/public-domain/public-domain.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.WORKSPACE_MEMBERS),
)
@UsePipes(ResolverValidationPipe)
@UseFilters(
  PublicDomainExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
@MetadataResolver()
export class PublicDomainResolver {
  constructor(
    @InjectWorkspaceScopedRepository(PublicDomainEntity)
    private readonly publicDomainRepository: WorkspaceScopedRepository<PublicDomainEntity>,
    private readonly publicDomainService: PublicDomainService,
    private readonly dnsManagerService: DnsManagerService,
  ) {}

  @Query(() => [PublicDomainDTO])
  // Lists all public domains registered for the workspace.
  async findManyPublicDomains(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<PublicDomainDTO[]> {
    return this.publicDomainRepository.find(currentWorkspace.id);
  }

  @Mutation(() => PublicDomainDTO)
  // Registers a new public domain for the given application.
  async createPublicDomain(
    @Args() { domain, applicationId }: CreatePublicDomainInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<PublicDomainDTO> {
    return this.publicDomainService.createPublicDomain({
      domain,
      workspace: currentWorkspace,
      applicationId,
    });
  }

  @Mutation(() => Boolean)
  // Deletes a public domain from the workspace.
  async deletePublicDomain(
    @Args() { domain }: PublicDomainInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<boolean> {
    await this.publicDomainService.deletePublicDomain({
      domain,
      workspace: currentWorkspace,
    });

    return true;
  }

  @Mutation(() => DomainValidRecords, { nullable: true })
  // Refreshes and returns the DNS validation records/status for a public domain.
  async checkPublicDomainValidRecords(
    @Args() { domain }: PublicDomainInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DomainValidRecords | undefined> {
    const publicDomain = await this.publicDomainRepository.findOne(
      workspace.id,
      { where: { domain } },
    );

    assertIsDefinedOrThrow(
      publicDomain,
      new PublicDomainException(
        `Public domain ${domain} not found`,
        PublicDomainExceptionCode.PUBLIC_DOMAIN_NOT_FOUND,
      ),
    );

    const domainValidRecords = await this.dnsManagerService.refreshHostname(
      domain,
      {
        isPublicDomain: true,
      },
    );

    return this.publicDomainService.checkPublicDomainValidRecords(
      publicDomain,
      domainValidRecords,
    );
  }
}
