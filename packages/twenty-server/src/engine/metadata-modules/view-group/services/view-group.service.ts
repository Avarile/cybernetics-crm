import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { IsNull } from 'typeorm';

import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { findFlatEntityByIdInFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps-or-throw.util';
import { findFlatEntityByUniversalIdentifierOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier-or-throw.util';
import { findManyFlatEntityByIdInFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-many-flat-entity-by-id-in-flat-entity-maps-or-throw.util';
import { fromCreateViewGroupInputToFlatViewGroupToCreate } from 'src/engine/metadata-modules/flat-view-group/utils/from-create-view-group-input-to-flat-view-group-to-create.util';
import { fromDeleteViewGroupInputToFlatViewGroupOrThrow } from 'src/engine/metadata-modules/flat-view-group/utils/from-delete-view-group-input-to-flat-view-group-or-throw.util';
import { fromDestroyViewGroupInputToFlatViewGroupOrThrow } from 'src/engine/metadata-modules/flat-view-group/utils/from-destroy-view-group-input-to-flat-view-group-or-throw.util';
import { fromUpdateViewGroupInputToFlatViewGroupToUpdateOrThrow } from 'src/engine/metadata-modules/flat-view-group/utils/from-update-view-group-input-to-flat-view-group-to-update-or-throw.util';
import { CreateViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/create-view-group.input';
import { DeleteViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/delete-view-group.input';
import { DestroyViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/destroy-view-group.input';
import { UpdateViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/update-view-group.input';
import { ViewGroupDTO } from 'src/engine/metadata-modules/view-group/dtos/view-group.dto';
import { ViewGroupEntity } from 'src/engine/metadata-modules/view-group/entities/view-group.entity';
import {
  ViewGroupException,
  ViewGroupExceptionCode,
} from 'src/engine/metadata-modules/view-group/exceptions/view-group.exception';
import { fromFlatViewGroupToViewGroupDto } from 'src/engine/metadata-modules/view-group/utils/from-flat-view-group-to-view-group-dto.util';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

@Injectable()
// CRUD (including batch create/update) for view groups, backed by the
// flat entity maps and applied through validated workspace migrations.
export class ViewGroupService {
  constructor(
    @InjectWorkspaceScopedRepository(ViewGroupEntity)
    private readonly viewGroupRepository: WorkspaceScopedRepository<ViewGroupEntity>,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly applicationService: ApplicationService,
  ) {}

  // Creates a single view group (thin wrapper over createMany).
  async createOne({
    createViewGroupInput,
    workspaceId,
  }: {
    createViewGroupInput: CreateViewGroupInput;
    workspaceId: string;
  }): Promise<ViewGroupDTO> {
    const [createdViewGroup] = await this.createMany({
      workspaceId,
      createViewGroupInputs: [createViewGroupInput],
    });

    if (!isDefined(createdViewGroup)) {
      throw new ViewGroupException(
        'Failed to create view group',
        ViewGroupExceptionCode.INVALID_VIEW_GROUP_DATA,
      );
    }

    return createdViewGroup;
  }

  // Builds flat view groups for each input, rejecting any whose target
  // view isn't configured for grouping (missing mainGroupByFieldMetadataId),
  // then applies them all in one validated workspace migration.
  async createMany({
    createViewGroupInputs,
    workspaceId,
  }: {
    createViewGroupInputs: CreateViewGroupInput[];
    workspaceId: string;
  }): Promise<ViewGroupDTO[]> {
    if (createViewGroupInputs.length === 0) {
      return [];
    }

    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        {
          workspaceId,
        },
      );

    const { flatViewMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatViewMaps'],
        },
      );

    const flatViewGroupsToCreate = createViewGroupInputs.map(
      (createViewGroupInput) => {
        const mainGroupByFieldMetadataId = findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: createViewGroupInput.viewId,
          flatEntityMaps: flatViewMaps,
        })?.mainGroupByFieldMetadataId;

        if (!isDefined(mainGroupByFieldMetadataId)) {
          throw new ViewGroupException(
            'The associated view is not a grouped view: mainGroupByFieldMetadataId is missing.',
            ViewGroupExceptionCode.MISSING_MAIN_GROUP_BY_FIELD_METADATA_ID,
          );
        }

        return fromCreateViewGroupInputToFlatViewGroupToCreate({
          createViewGroupInput,
          flatApplication: workspaceCustomFlatApplication,
          flatViewMaps,
        });
      },
    );

    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          allFlatEntityOperationByMetadataName: {
            viewGroup: {
              flatEntityToCreate: flatViewGroupsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
          workspaceId,
          isSystemBuild: false,
          applicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        validateAndBuildResult,
        'Multiple validation errors occurred while creating view groups',
      );
    }

    const { flatViewGroupMaps: recomputedExistingFlatViewGroupMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatViewGroupMaps'],
        },
      );

    return findManyFlatEntityByIdInFlatEntityMapsOrThrow({
      flatEntityIds: flatViewGroupsToCreate.map((el) => el.id),
      flatEntityMaps: recomputedExistingFlatViewGroupMaps,
    }).map(fromFlatViewGroupToViewGroupDto);
  }

  // Updates a single view group (thin wrapper over updateMany).
  async updateOne({
    updateViewGroupInput,
    workspaceId,
  }: {
    workspaceId: string;
    updateViewGroupInput: UpdateViewGroupInput;
  }): Promise<ViewGroupDTO> {
    const [updatedViewGroup] = await this.updateMany({
      updateViewGroupInputs: [updateViewGroupInput],
      workspaceId,
    });

    if (!isDefined(updatedViewGroup)) {
      throw new ViewGroupException(
        'Failed to update view group',
        ViewGroupExceptionCode.INVALID_VIEW_GROUP_DATA,
      );
    }

    return updatedViewGroup;
  }

  // Applies partial updates to multiple view groups in one validated
  // workspace migration.
  async updateMany({
    updateViewGroupInputs,
    workspaceId,
  }: {
    updateViewGroupInputs: UpdateViewGroupInput[];
    workspaceId: string;
  }): Promise<ViewGroupDTO[]> {
    if (updateViewGroupInputs.length === 0) {
      return [];
    }

    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        {
          workspaceId,
        },
      );

    const { flatViewGroupMaps: existingFlatViewGroupMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatViewGroupMaps'],
        },
      );

    const flatViewGroupsToUpdate = updateViewGroupInputs.map(
      (updateViewGroupInput) =>
        fromUpdateViewGroupInputToFlatViewGroupToUpdateOrThrow({
          flatViewGroupMaps: existingFlatViewGroupMaps,
          updateViewGroupInput,
        }),
    );

    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          allFlatEntityOperationByMetadataName: {
            viewGroup: {
              flatEntityToCreate: [],
              flatEntityToDelete: [],
              flatEntityToUpdate: flatViewGroupsToUpdate,
            },
          },
          workspaceId,
          isSystemBuild: false,
          applicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        validateAndBuildResult,
        'Multiple validation errors occurred while updating view groups',
      );
    }

    const { flatViewGroupMaps: recomputedExistingFlatViewGroupMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatViewGroupMaps'],
        },
      );

    return updateViewGroupInputs.map(({ id }) =>
      fromFlatViewGroupToViewGroupDto(
        findFlatEntityByIdInFlatEntityMapsOrThrow({
          flatEntityId: id,
          flatEntityMaps: recomputedExistingFlatViewGroupMaps,
        }),
      ),
    );
  }

  // Soft-deletes a view group (sets deletedAt) via a validated workspace
  // migration.
  async deleteOne({
    deleteViewGroupInput,
    workspaceId,
  }: {
    deleteViewGroupInput: DeleteViewGroupInput;
    workspaceId: string;
  }): Promise<ViewGroupDTO> {
    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        {
          workspaceId,
        },
      );

    const { flatViewGroupMaps: existingFlatViewGroupMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatViewGroupMaps'],
        },
      );

    const optimisticallyUpdatedFlatViewGroupWithDeletedAt =
      fromDeleteViewGroupInputToFlatViewGroupOrThrow({
        flatViewGroupMaps: existingFlatViewGroupMaps,
        deleteViewGroupInput,
      });

    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          allFlatEntityOperationByMetadataName: {
            viewGroup: {
              flatEntityToCreate: [],
              flatEntityToDelete: [],
              flatEntityToUpdate: [
                optimisticallyUpdatedFlatViewGroupWithDeletedAt,
              ],
            },
          },
          workspaceId,
          isSystemBuild: false,
          applicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        validateAndBuildResult,
        'Multiple validation errors occurred while deleting view group',
      );
    }

    const { flatViewGroupMaps: recomputedExistingFlatViewGroupMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatViewGroupMaps'],
        },
      );

    return fromFlatViewGroupToViewGroupDto(
      findFlatEntityByUniversalIdentifierOrThrow({
        universalIdentifier:
          optimisticallyUpdatedFlatViewGroupWithDeletedAt.universalIdentifier,
        flatEntityMaps: recomputedExistingFlatViewGroupMaps,
      }),
    );
  }

  // Permanently removes a view group via a validated workspace migration.
  async destroyOne({
    destroyViewGroupInput,
    workspaceId,
  }: {
    destroyViewGroupInput: DestroyViewGroupInput;
    workspaceId: string;
  }): Promise<ViewGroupDTO> {
    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        {
          workspaceId,
        },
      );

    const { flatViewGroupMaps: existingFlatViewGroupMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatViewGroupMaps'],
        },
      );

    const existingViewGroupToDelete =
      fromDestroyViewGroupInputToFlatViewGroupOrThrow({
        destroyViewGroupInput,
        flatViewGroupMaps: existingFlatViewGroupMaps,
      });

    const existingFlatViewGroup = findFlatEntityByUniversalIdentifierOrThrow({
      universalIdentifier: existingViewGroupToDelete.universalIdentifier,
      flatEntityMaps: existingFlatViewGroupMaps,
    });

    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          allFlatEntityOperationByMetadataName: {
            viewGroup: {
              flatEntityToCreate: [],
              flatEntityToDelete: [existingViewGroupToDelete],
              flatEntityToUpdate: [],
            },
          },
          workspaceId,
          isSystemBuild: false,
          applicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        validateAndBuildResult,
        'Multiple validation errors occurred while destroying view group',
      );
    }

    return fromFlatViewGroupToViewGroupDto({
      ...existingFlatViewGroup,
      deletedAt: new Date().toISOString(),
    });
  }

  // Returns all active view groups in the workspace, ordered by position.
  async findByWorkspaceId(workspaceId: string): Promise<ViewGroupEntity[]> {
    return this.viewGroupRepository.find(workspaceId, {
      where: {
        deletedAt: IsNull(),
      },
      order: { position: 'ASC' },
      relations: ['workspace', 'view'],
    });
  }

  // Returns all active view groups belonging to a specific view.
  async findByViewId(
    workspaceId: string,
    viewId: string,
  ): Promise<ViewGroupEntity[]> {
    return this.viewGroupRepository.find(workspaceId, {
      where: {
        viewId,
        deletedAt: IsNull(),
      },
      order: { position: 'ASC' },
      relations: ['workspace', 'view'],
    });
  }

  // Finds a single active view group by id.
  async findById(
    id: string,
    workspaceId: string,
  ): Promise<ViewGroupEntity | null> {
    const viewGroup = await this.viewGroupRepository.findOne(workspaceId, {
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ['workspace', 'view'],
    });

    return viewGroup || null;
  }
}
