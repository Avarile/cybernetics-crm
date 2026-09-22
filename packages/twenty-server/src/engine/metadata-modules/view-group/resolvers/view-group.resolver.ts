import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CreateViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/create-view-group.input';
import { DeleteViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/delete-view-group.input';
import { DestroyViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/destroy-view-group.input';
import { UpdateViewGroupInput } from 'src/engine/metadata-modules/view-group/dtos/inputs/update-view-group.input';
import { ViewGroupDTO } from 'src/engine/metadata-modules/view-group/dtos/view-group.dto';
import { ViewGroupService } from 'src/engine/metadata-modules/view-group/services/view-group.service';
import { ViewGroupGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/view-group/utils/view-group-graphql-api-exception.filter';
import { CreateViewGroupPermissionGuard } from 'src/engine/metadata-modules/view-permissions/guards/create-view-group-permission.guard';
import { DeleteViewGroupPermissionGuard } from 'src/engine/metadata-modules/view-permissions/guards/delete-view-group-permission.guard';
import { DestroyViewGroupPermissionGuard } from 'src/engine/metadata-modules/view-permissions/guards/destroy-view-group-permission.guard';
import { UpdateViewGroupPermissionGuard } from 'src/engine/metadata-modules/view-permissions/guards/update-view-group-permission.guard';

@MetadataResolver(() => ViewGroupDTO)
@UseFilters(ViewGroupGraphqlApiExceptionFilter)
@UseGuards(WorkspaceAuthGuard)
// GraphQL resolver exposing CRUD operations for view groups, including
// batch create/update.
export class ViewGroupResolver {
  constructor(private readonly viewGroupService: ViewGroupService) {}

  // Lists view groups in the workspace, optionally filtered to one view.
  @Query(() => [ViewGroupDTO])
  @UseGuards(NoPermissionGuard)
  async getViewGroups(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('viewId', { type: () => String, nullable: true })
    viewId?: string,
  ): Promise<ViewGroupDTO[]> {
    if (viewId) {
      return this.viewGroupService.findByViewId(workspace.id, viewId);
    }

    return this.viewGroupService.findByWorkspaceId(workspace.id);
  }

  // Fetches a single view group by id.
  @Query(() => ViewGroupDTO, { nullable: true })
  @UseGuards(NoPermissionGuard)
  async getViewGroup(
    @Args('id', { type: () => String }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<ViewGroupDTO | null> {
    return this.viewGroupService.findById(id, workspace.id);
  }

  // Creates a single new view group.
  @Mutation(() => ViewGroupDTO)
  @UseGuards(CreateViewGroupPermissionGuard)
  async createViewGroup(
    @Args('input') createViewGroupInput: CreateViewGroupInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<ViewGroupDTO> {
    return await this.viewGroupService.createOne({
      createViewGroupInput,
      workspaceId,
    });
  }

  // Creates multiple view groups in one migration.
  @Mutation(() => [ViewGroupDTO])
  @UseGuards(CreateViewGroupPermissionGuard)
  async createManyViewGroups(
    @Args('inputs', { type: () => [CreateViewGroupInput] })
    createViewGroupInputs: CreateViewGroupInput[],
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<ViewGroupDTO[]> {
    return await this.viewGroupService.createMany({
      createViewGroupInputs,
      workspaceId,
    });
  }

  // Updates a single view group.
  @Mutation(() => ViewGroupDTO)
  @UseGuards(UpdateViewGroupPermissionGuard)
  async updateViewGroup(
    @Args('input') updateViewGroupInput: UpdateViewGroupInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<ViewGroupDTO> {
    return await this.viewGroupService.updateOne({
      updateViewGroupInput,
      workspaceId,
    });
  }

  // Updates multiple view groups in one migration.
  @Mutation(() => [ViewGroupDTO])
  @UseGuards(UpdateViewGroupPermissionGuard)
  async updateManyViewGroups(
    @Args('inputs', { type: () => [UpdateViewGroupInput] })
    updateViewGroupInputs: UpdateViewGroupInput[],
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<ViewGroupDTO[]> {
    return await this.viewGroupService.updateMany({
      updateViewGroupInputs,
      workspaceId,
    });
  }

  // Soft-deletes a view group.
  @Mutation(() => ViewGroupDTO)
  @UseGuards(DeleteViewGroupPermissionGuard)
  async deleteViewGroup(
    @Args('input') deleteViewGroupInput: DeleteViewGroupInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<ViewGroupDTO> {
    return await this.viewGroupService.deleteOne({
      deleteViewGroupInput,
      workspaceId,
    });
  }

  // Permanently destroys a view group.
  @Mutation(() => ViewGroupDTO)
  @UseGuards(DestroyViewGroupPermissionGuard)
  async destroyViewGroup(
    @Args('input') destroyViewGroupInput: DestroyViewGroupInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<ViewGroupDTO> {
    return await this.viewGroupService.destroyOne({
      destroyViewGroupInput,
      workspaceId,
    });
  }
}
