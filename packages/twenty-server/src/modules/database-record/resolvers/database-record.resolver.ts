import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { FeatureFlagKey } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import {
  FeatureFlagGuard,
  RequireFeatureFlag,
} from 'src/engine/guards/feature-flag.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { DatabaseCentreAvailabilityDTO } from 'src/modules/database-record/dtos/database-connection.dto';
import { AttachDatabaseRecordsInput } from 'src/modules/database-record/dtos/attach-database-records.input';
import {
  DatabaseCentreRecordDetailDTO,
  DatabaseCentreRecordPageDTO,
  DatabaseCentreRecordsQueryInput,
  DatabaseCentreSpaceDTO,
  DatabaseCentreTableDTO,
  DatabaseCentreTableSchemaDTO,
} from 'src/modules/database-record/dtos/database-centre-browse.dto';
import { DatabaseConnectionService } from 'src/modules/database-record/services/database-connection.service';
import { DatabaseRecordAttachmentService } from 'src/modules/database-record/services/database-record-attachment.service';
import { DatabaseRecordBrowseService } from 'src/modules/database-record/services/database-record-browse.service';
import { DatabaseCentreGraphqlApiExceptionFilter } from 'src/modules/database-record/utils/database-centre-graphql-api-exception.filter';

// Member-facing API for browsing the data centre and attaching its records
// to CRM records. Browsing uses the workspace-wide token, so any member of a
// workspace with the integration enabled can browse; attach/detach/refresh
// are further gated by the standard object permissions on
// databaseRecordTarget and read access to the target record.
@MetadataResolver()
@UseGuards(WorkspaceAuthGuard, FeatureFlagGuard, NoPermissionGuard)
@UseFilters(DatabaseCentreGraphqlApiExceptionFilter)
@UsePipes(ResolverValidationPipe)
export class DatabaseRecordResolver {
  constructor(
    private readonly databaseConnectionService: DatabaseConnectionService,
    private readonly databaseRecordBrowseService: DatabaseRecordBrowseService,
    private readonly databaseRecordAttachmentService: DatabaseRecordAttachmentService,
  ) {}

  @Query(() => DatabaseCentreAvailabilityDTO)
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async databaseCentreAvailability(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DatabaseCentreAvailabilityDTO> {
    const connection = await this.databaseConnectionService.findConnection(
      workspace.id,
    );

    return {
      isConfigured: isDefined(connection),
      isEnabled: connection?.isEnabled === true,
    };
  }

  @Query(() => [DatabaseCentreSpaceDTO])
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async databaseCentreSpaces(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DatabaseCentreSpaceDTO[]> {
    return this.databaseRecordBrowseService.listSpaces(workspace.id);
  }

  @Query(() => [DatabaseCentreTableDTO])
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async databaseCentreTables(
    @Args('baseId') baseId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DatabaseCentreTableDTO[]> {
    return this.databaseRecordBrowseService.listTables(workspace.id, baseId);
  }

  @Query(() => DatabaseCentreTableSchemaDTO)
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async databaseCentreTableSchema(
    @Args('baseId') baseId: string,
    @Args('tableId') tableId: string,
    @Args('viewId', { type: () => String, nullable: true })
    viewId: string | null,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DatabaseCentreTableSchemaDTO> {
    return this.databaseRecordBrowseService.getTableSchema(
      workspace.id,
      baseId,
      tableId,
      viewId,
    );
  }

  @Query(() => DatabaseCentreRecordPageDTO)
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async databaseCentreRecords(
    @Args('input') input: DatabaseCentreRecordsQueryInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DatabaseCentreRecordPageDTO> {
    return this.databaseRecordBrowseService.queryRecords(workspace.id, input);
  }

  @Query(() => DatabaseCentreRecordDetailDTO)
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async databaseCentreRecord(
    @Args('baseId') baseId: string,
    @Args('tableId') tableId: string,
    @Args('recordId') recordId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DatabaseCentreRecordDetailDTO> {
    return this.databaseRecordBrowseService.getRecordDetail(
      workspace.id,
      baseId,
      tableId,
      recordId,
    );
  }

  @Mutation(() => [UUIDScalarType])
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async attachDatabaseCentreRecords(
    @Args('input') input: AttachDatabaseRecordsInput,
  ): Promise<string[]> {
    return this.databaseRecordAttachmentService.attach(
      getWorkspaceAuthContext(),
      input,
    );
  }

  @Mutation(() => Boolean)
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async detachDatabaseCentreRecord(
    @Args('databaseRecordTargetId', { type: () => UUIDScalarType })
    databaseRecordTargetId: string,
  ): Promise<boolean> {
    return this.databaseRecordAttachmentService.detach(
      getWorkspaceAuthContext(),
      databaseRecordTargetId,
    );
  }

  @Mutation(() => String)
  @RequireFeatureFlag(FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED)
  async refreshDatabaseCentreRecordSnapshot(
    @Args('databaseRecordTargetId', { type: () => UUIDScalarType })
    databaseRecordTargetId: string,
  ): Promise<string> {
    return this.databaseRecordAttachmentService.refresh(
      getWorkspaceAuthContext(),
      databaseRecordTargetId,
    );
  }
}
