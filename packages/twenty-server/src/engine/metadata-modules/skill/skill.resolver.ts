import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CreateSkillInput } from 'src/engine/metadata-modules/skill/dtos/create-skill.input';
import { SkillDTO } from 'src/engine/metadata-modules/skill/dtos/skill.dto';
import { UpdateSkillInput } from 'src/engine/metadata-modules/skill/dtos/update-skill.input';
import { SkillGraphqlApiExceptionInterceptor } from 'src/engine/metadata-modules/skill/interceptors/skill-graphql-api-exception.interceptor';
import { SkillService } from 'src/engine/metadata-modules/skill/skill.service';
import { WorkspaceMigrationGraphqlApiExceptionInterceptor } from 'src/engine/workspace-manager/workspace-migration/interceptors/workspace-migration-graphql-api-exception.interceptor';

@UseGuards(
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.AI_SETTINGS),
)
@UseInterceptors(
  WorkspaceMigrationGraphqlApiExceptionInterceptor,
  SkillGraphqlApiExceptionInterceptor,
)
// GraphQL entry points for reading, creating, updating, deleting and (de)activating skills.
@MetadataResolver(() => SkillDTO)
export class SkillResolver {
  constructor(private readonly skillService: SkillService) {}

  // Returns all skills in the workspace.
  @Query(() => [SkillDTO])
  async skills(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SkillDTO[]> {
    return this.skillService.findAll(workspace.id);
  }

  // Returns a single skill by id, or null if not found.
  @Query(() => SkillDTO, { nullable: true })
  async skill(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SkillDTO | null> {
    return this.skillService.findById(id, workspace.id);
  }

  // Creates a new custom skill.
  @Mutation(() => SkillDTO)
  async createSkill(
    @Args('input') input: CreateSkillInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SkillDTO> {
    return this.skillService.create(input, workspace.id);
  }

  // Updates an existing custom skill.
  @Mutation(() => SkillDTO)
  async updateSkill(
    @Args('input') input: UpdateSkillInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SkillDTO> {
    return this.skillService.update(input, workspace.id);
  }

  // Deletes a custom skill.
  @Mutation(() => SkillDTO)
  async deleteSkill(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SkillDTO> {
    return this.skillService.delete(id, workspace.id);
  }

  // Marks a skill active, making it available to agents.
  @Mutation(() => SkillDTO)
  async activateSkill(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SkillDTO> {
    return this.skillService.activate(id, workspace.id);
  }

  // Marks a skill inactive, removing it from agents' available skills.
  @Mutation(() => SkillDTO)
  async deactivateSkill(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SkillDTO> {
    return this.skillService.deactivate(id, workspace.id);
  }
}
