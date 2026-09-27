import { Injectable, Logger } from '@nestjs/common';

import { capitalize, isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ActorFromAuthContextService } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { ApiKeyRoleService } from 'src/engine/core-modules/api-key/services/api-key-role.service';
import { CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { buildFieldMapsFromFlatObjectMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/build-field-maps-from-flat-object-metadata.util';
import { buildObjectIdByNameMaps } from 'src/engine/metadata-modules/flat-object-metadata/utils/build-object-id-by-name-maps.util';
import {
  PermissionsException,
  PermissionsExceptionCode,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { UserRoleService } from 'src/engine/metadata-modules/user-role/user-role.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { type RolePermissionConfig } from 'src/engine/twenty-orm/types/role-permission-config';
import { DATABASE_CENTRE_MAX_ATTACHMENTS_PER_RECORD } from 'src/modules/database-record/constants/database-centre.constants';
import { type AttachDatabaseRecordsInput } from 'src/modules/database-record/dtos/attach-database-records.input';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';
import {
  type ActiveDatabaseConnection,
  DatabaseConnectionService,
} from 'src/modules/database-record/services/database-connection.service';
import {
  type DatabaseRecordSnapshot,
  DatabaseRecordSnapshotService,
} from 'src/modules/database-record/services/database-record-snapshot.service';
import { type DatabaseRecordTargetWorkspaceEntity } from 'src/modules/database-record/standard-objects/database-record-target.workspace-entity';
import { type DatabaseRecordSnapshotStatus } from 'src/modules/database-record/types/database-centre-status.type';

const DATABASE_RECORD_TARGET_OBJECT_NAME = 'databaseRecordTarget';

// Attaches, detaches and refreshes data-centre records on any CRM record.
// Writes go through permission-checked repositories under the caller's auth
// context, so the standard per-role object permissions on
// databaseRecordTarget (and read access to the target record) apply as-is.
@Injectable()
export class DatabaseRecordAttachmentService {
  private readonly logger = new Logger(DatabaseRecordAttachmentService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceManyOrAllFlatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly cacheLockService: CacheLockService,
    private readonly databaseConnectionService: DatabaseConnectionService,
    private readonly databaseRecordSnapshotService: DatabaseRecordSnapshotService,
    private readonly userRoleService: UserRoleService,
    private readonly apiKeyRoleService: ApiKeyRoleService,
    private readonly actorFromAuthContextService: ActorFromAuthContextService,
  ) {}

  async attach(
    authContext: WorkspaceAuthContext,
    input: AttachDatabaseRecordsInput,
  ): Promise<string[]> {
    const workspaceId = authContext.workspace.id;
    const targetJoinColumnName = await this.getTargetJoinColumnNameOrThrow(
      workspaceId,
      input.targetObjectNameSingular,
    );

    await this.assertTargetRecordIsReadable(
      authContext,
      input.targetObjectNameSingular,
      input.targetRecordId,
    );

    const activeConnection =
      await this.databaseConnectionService.getActiveConnectionOrThrow(
        workspaceId,
      );

    const uniqueRecordIds = Array.from(new Set(input.recordIds));

    // Fetched before taking the lock: upstream calls are the slow part
    const buildSnapshot = (recordId: string) =>
      this.databaseRecordSnapshotService.buildSnapshot(
        activeConnection,
        workspaceId,
        {
          baseId: input.baseId,
          tableId: input.tableId,
          recordId,
          viewId: input.viewId,
        },
      );

    // The first snapshot warms the base/table/schema cache, so the rest,
    // fetched in parallel, only cost one record read each
    const [firstRecordId, ...otherRecordIds] = uniqueRecordIds;
    const snapshots: DatabaseRecordSnapshot[] = [
      await buildSnapshot(firstRecordId),
      ...(await Promise.all(otherRecordIds.map(buildSnapshot))),
    ];

    // Serializes concurrent attaches to the same record so the cap and
    // uniqueness checks can't be raced
    return this.cacheLockService.withLock(
      () =>
        this.withDatabaseRecordTargetRepository(
          authContext,
          async (repository) => {
            const existingTargets = await repository.find({
              where: { [targetJoinColumnName]: input.targetRecordId },
            });

            const existingKeys = new Set(
              existingTargets.map(
                (target) => `${target.tableId}:${target.recordId}`,
              ),
            );

            const newSnapshots = snapshots.filter(
              (snapshot) =>
                !existingKeys.has(`${snapshot.tableId}:${snapshot.recordId}`),
            );

            if (newSnapshots.length === 0) {
              throw new DatabaseCentreException(
                `Records already attached to ${input.targetObjectNameSingular} ${input.targetRecordId}`,
                DatabaseCentreExceptionCode.ALREADY_ATTACHED,
              );
            }

            if (
              existingTargets.length + newSnapshots.length >
              DATABASE_CENTRE_MAX_ATTACHMENTS_PER_RECORD
            ) {
              throw new DatabaseCentreException(
                `Attaching ${newSnapshots.length} records would exceed the limit of ${DATABASE_CENTRE_MAX_ATTACHMENTS_PER_RECORD} on ${input.targetObjectNameSingular} ${input.targetRecordId}`,
                DatabaseCentreExceptionCode.ATTACHMENT_LIMIT_REACHED,
              );
            }

            // Direct repository writes skip the query-runner hooks that fill
            // createdBy/updatedBy, so the acting user is attributed here
            const recordsWithActor =
              await this.actorFromAuthContextService.injectActorFieldsOnCreate({
                records: newSnapshots.map((snapshot) => ({
                  ...snapshot,
                  [targetJoinColumnName]: input.targetRecordId,
                })),
                objectMetadataNameSingular: DATABASE_RECORD_TARGET_OBJECT_NAME,
                authContext,
              });

            const insertResult = await repository.insert(recordsWithActor);

            return insertResult.identifiers
              .map((identifier) => identifier.id)
              .filter((id): id is string => typeof id === 'string');
          },
        ),
      `database-centre:attach:${workspaceId}:${input.targetRecordId}`,
    );
  }

  async detach(
    authContext: WorkspaceAuthContext,
    databaseRecordTargetId: string,
  ): Promise<boolean> {
    return this.withDatabaseRecordTargetRepository(
      authContext,
      async (repository) => {
        await this.findTargetOrThrow(repository, databaseRecordTargetId);
        await repository.softDelete({ id: databaseRecordTargetId });

        return true;
      },
    );
  }

  async refresh(
    authContext: WorkspaceAuthContext,
    databaseRecordTargetId: string,
  ): Promise<DatabaseRecordSnapshotStatus> {
    const workspaceId = authContext.workspace.id;

    const target = await this.withDatabaseRecordTargetRepository(
      authContext,
      (repository) =>
        this.findTargetOrThrow(repository, databaseRecordTargetId),
    );

    const activeConnection =
      await this.databaseConnectionService.getActiveConnectionOrThrow(
        workspaceId,
      );

    const update = await this.buildRefreshUpdate(
      activeConnection,
      workspaceId,
      target,
    );

    await this.withDatabaseRecordTargetRepository(authContext, (repository) =>
      repository.update({ id: target.id }, update),
    );

    return update.snapshotStatus;
  }

  // Shared with the background refresh job: on a record-level upstream
  // failure only the status changes, so the last good preview stays visible
  async buildRefreshUpdate(
    activeConnection: ActiveDatabaseConnection,
    workspaceId: string,
    target: DatabaseRecordTargetWorkspaceEntity,
  ): Promise<
    Partial<DatabaseRecordSnapshot> & {
      snapshotStatus: DatabaseRecordSnapshotStatus;
      snapshotAt: string;
    }
  > {
    try {
      return await this.databaseRecordSnapshotService.buildSnapshot(
        activeConnection,
        workspaceId,
        {
          baseId: target.baseId,
          tableId: target.tableId,
          recordId: target.recordId,
          viewId: target.viewId,
        },
      );
    } catch (error) {
      const snapshotStatus =
        this.databaseRecordSnapshotService.getFailedRefreshStatus(error);

      this.logger.log(
        `Data centre record ${target.tableId}/${target.recordId} is now ${snapshotStatus} (workspace ${workspaceId})`,
      );

      return { snapshotStatus, snapshotAt: new Date().toISOString() };
    }
  }

  // The join column exists only when databaseRecordTarget has a morph field
  // for the object: every covered standard object and every custom object
  // created (or retrofitted) after the integration shipped
  private async getTargetJoinColumnNameOrThrow(
    workspaceId: string,
    targetObjectNameSingular: string,
  ): Promise<string> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceManyOrAllFlatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const { idByNameSingular } = buildObjectIdByNameMaps(
      flatObjectMetadataMaps,
    );

    const databaseRecordTargetObjectMetadata =
      findFlatEntityByIdInFlatEntityMaps({
        flatEntityMaps: flatObjectMetadataMaps,
        flatEntityId: idByNameSingular[DATABASE_RECORD_TARGET_OBJECT_NAME],
      });

    const morphFieldName = `target${capitalize(targetObjectNameSingular)}`;

    const fieldIdByName = isDefined(databaseRecordTargetObjectMetadata)
      ? buildFieldMapsFromFlatObjectMetadata(
          flatFieldMetadataMaps,
          databaseRecordTargetObjectMetadata,
        ).fieldIdByName
      : {};

    if (
      !isDefined(idByNameSingular[targetObjectNameSingular]) ||
      !isDefined(fieldIdByName[morphFieldName])
    ) {
      throw new DatabaseCentreException(
        `Object ${targetObjectNameSingular} does not support data centre records`,
        DatabaseCentreExceptionCode.TARGET_OBJECT_NOT_SUPPORTED,
      );
    }

    return `${morphFieldName}Id`;
  }

  private async assertTargetRecordIsReadable(
    authContext: WorkspaceAuthContext,
    targetObjectNameSingular: string,
    targetRecordId: string,
  ): Promise<void> {
    const workspaceId = authContext.workspace.id;
    const rolePermissionConfig =
      await this.getRolePermissionConfigOrThrow(authContext);

    const targetRecord =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const repository = await this.globalWorkspaceOrmManager.getRepository(
            workspaceId,
            targetObjectNameSingular,
            rolePermissionConfig,
          );

          return repository.findOne({
            where: { id: targetRecordId },
            select: { id: true },
          });
        },
        authContext,
      );

    if (!isDefined(targetRecord)) {
      throw new DatabaseCentreException(
        `${targetObjectNameSingular} ${targetRecordId} not found`,
        DatabaseCentreExceptionCode.TARGET_RECORD_NOT_FOUND,
      );
    }
  }

  private async findTargetOrThrow(
    repository: WorkspaceRepository<DatabaseRecordTargetWorkspaceEntity>,
    databaseRecordTargetId: string,
  ): Promise<DatabaseRecordTargetWorkspaceEntity> {
    const target = await repository.findOne({
      where: { id: databaseRecordTargetId },
    });

    if (!isDefined(target)) {
      throw new DatabaseCentreException(
        `Database record target ${databaseRecordTargetId} not found`,
        DatabaseCentreExceptionCode.DATABASE_RECORD_TARGET_NOT_FOUND,
      );
    }

    return target;
  }

  private async withDatabaseRecordTargetRepository<TResult>(
    authContext: WorkspaceAuthContext,
    callback: (
      repository: WorkspaceRepository<DatabaseRecordTargetWorkspaceEntity>,
    ) => Promise<TResult>,
  ): Promise<TResult> {
    const workspaceId = authContext.workspace.id;
    const rolePermissionConfig =
      await this.getRolePermissionConfigOrThrow(authContext);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository =
          await this.globalWorkspaceOrmManager.getRepository<DatabaseRecordTargetWorkspaceEntity>(
            workspaceId,
            DATABASE_RECORD_TARGET_OBJECT_NAME,
            rolePermissionConfig,
          );

        return callback(repository);
      },
      authContext,
    );
  }

  // Repositories only enforce object permissions when told which role to
  // evaluate; without one they refuse every query
  private async getRolePermissionConfigOrThrow(
    authContext: WorkspaceAuthContext,
  ): Promise<RolePermissionConfig> {
    const workspaceId = authContext.workspace.id;

    switch (authContext.type) {
      case 'user':
        return {
          unionOf: [
            await this.userRoleService.getRoleIdForUserWorkspace({
              workspaceId,
              userWorkspaceId: authContext.userWorkspaceId,
            }),
          ],
        };
      case 'apiKey':
        return {
          unionOf: [
            await this.apiKeyRoleService.getRoleIdForApiKeyId(
              authContext.apiKey.id,
              workspaceId,
            ),
          ],
        };
      default:
        throw new PermissionsException(
          `Auth context of type ${authContext.type} cannot attach data centre records`,
          PermissionsExceptionCode.PERMISSION_DENIED,
        );
    }
  }
}
