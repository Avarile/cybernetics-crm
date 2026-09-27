import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';
import { FeatureFlagKey } from 'twenty-shared/types';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import {
  FeatureFlagGuard,
  RequireFeatureFlag,
} from 'src/engine/guards/feature-flag.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import {
  DatabaseConnectionDTO,
  DatabaseConnectionVerificationDTO,
  UpsertDatabaseConnectionInput,
} from 'src/modules/database-record/dtos/database-connection.dto';
import { DatabaseConnectionService } from 'src/modules/database-record/services/database-connection.service';
import { DatabaseCentreGraphqlApiExceptionFilter } from 'src/modules/database-record/utils/database-centre-graphql-api-exception.filter';

// Settings-facing API for the workspace's data-centre connection. Restricted
// to roles holding the dedicated settings permission, since whoever holds it
// controls which external data every member can browse.
@MetadataResolver()
@UseGuards(
  WorkspaceAuthGuard,
  FeatureFlagGuard,
  SettingsPermissionGuard(PermissionFlagType.DATABASE_CENTRE_INTEGRATION),
)
@UseFilters(DatabaseCentreGraphqlApiExceptionFilter)
@UsePipes(ResolverValidationPipe)
export class DatabaseConnectionResolver {
  constructor(
    private readonly databaseConnectionService: DatabaseConnectionService,
  ) {}

  @Query(() => DatabaseConnectionDTO, { nullable: true })
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async databaseCentreConnection(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DatabaseConnectionDTO | null> {
    return this.databaseConnectionService.getConnectionDTO(workspace.id);
  }

  @Mutation(() => DatabaseConnectionDTO)
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async upsertDatabaseCentreConnection(
    @Args('input') input: UpsertDatabaseConnectionInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DatabaseConnectionDTO> {
    return this.databaseConnectionService.upsertConnection(workspace.id, input);
  }

  @Mutation(() => DatabaseConnectionVerificationDTO)
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async verifyDatabaseCentreConnection(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DatabaseConnectionVerificationDTO> {
    return this.databaseConnectionService.verifyConnection(workspace.id);
  }
}
