import { Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { ApplicationTokenService } from 'src/engine/core-modules/auth/token/services/application-token.service';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { fromFlatFrontComponentToFrontComponentDto } from 'src/engine/metadata-modules/flat-front-component/utils/from-flat-front-component-to-front-component-dto.util';
import { CreateFrontComponentInput } from 'src/engine/metadata-modules/front-component/dtos/create-front-component.input';
import { FrontComponentDTO } from 'src/engine/metadata-modules/front-component/dtos/front-component.dto';
import { UpdateFrontComponentInput } from 'src/engine/metadata-modules/front-component/dtos/update-front-component.input';
import { FrontComponentService } from 'src/engine/metadata-modules/front-component/front-component.service';
import { FrontComponentGraphqlApiExceptionInterceptor } from 'src/engine/metadata-modules/front-component/interceptors/front-component-graphql-api-exception.interceptor';
import { stripSecretFromApplicationVariables } from 'src/engine/metadata-modules/front-component/utils/strip-secret-from-application-variables';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationGraphqlApiExceptionInterceptor } from 'src/engine/workspace-manager/workspace-migration/interceptors/workspace-migration-graphql-api-exception.interceptor';

@UseGuards(WorkspaceAuthGuard)
@UseInterceptors(
  WorkspaceMigrationGraphqlApiExceptionInterceptor,
  FrontComponentGraphqlApiExceptionInterceptor,
)
@MetadataResolver(() => FrontComponentDTO)
// GraphQL resolver for front components: CRUD plus, for a single
// component fetch, issuing an application token pair and exposing its
// non-secret application variables so the component can call back into
// the platform at runtime.
export class FrontComponentResolver {
  constructor(
    @Inject(FrontComponentService)
    private readonly frontComponentService: FrontComponentService,
    @Inject(ApplicationTokenService)
    private readonly applicationTokenService: ApplicationTokenService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  // Lists all front components in the workspace.
  @Query(() => [FrontComponentDTO])
  @UseGuards(NoPermissionGuard)
  async frontComponents(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentDTO[]> {
    return await this.frontComponentService.findAll(workspace.id);
  }

  // Fetches a front component by id along with a freshly issued
  // application token pair and its non-secret application variables, so
  // the client can render and authenticate the component immediately.
  @Query(() => FrontComponentDTO, { nullable: true })
  @UseGuards(UserAuthGuard, NoPermissionGuard)
  async frontComponent(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ): Promise<FrontComponentDTO | null> {
    const dto = await this.frontComponentService.findById(id, workspace.id);

    if (!dto) {
      return null;
    }

    const tokenPair =
      await this.applicationTokenService.generateApplicationTokenPair({
        applicationId: dto.applicationId,
        workspaceId: workspace.id,
        userWorkspaceId,
        userId: user.id,
      });

    const { applicationVariableMaps } =
      await this.workspaceCacheService.getOrRecompute(workspace.id, [
        'applicationVariableMaps',
      ]);

    const variableUniversalIdentifiers =
      applicationVariableMaps.universalIdentifiersByApplicationId[
        dto.applicationId
      ] ?? [];

    const flatApplicationVariables = variableUniversalIdentifiers
      .map(
        (universalIdentifier) =>
          applicationVariableMaps.byUniversalIdentifier[universalIdentifier],
      )
      .filter(isDefined);

    const applicationVariables = stripSecretFromApplicationVariables(
      flatApplicationVariables,
    );

    return {
      ...dto,
      applicationTokenPair: tokenPair,
      applicationVariables,
    };
  }

  // Registers a new front component.
  @Mutation(() => FrontComponentDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.APPLICATIONS))
  async createFrontComponent(
    @Args('input') input: CreateFrontComponentInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentDTO> {
    const flatFrontComponent = await this.frontComponentService.createOne({
      input,
      workspaceId: workspace.id,
    });

    return fromFlatFrontComponentToFrontComponentDto(flatFrontComponent);
  }

  // Updates an existing front component's metadata (name, description,
  // built checksum).
  @Mutation(() => FrontComponentDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.APPLICATIONS))
  async updateFrontComponent(
    @Args('input') input: UpdateFrontComponentInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentDTO> {
    const flatFrontComponent = await this.frontComponentService.updateOne({
      id: input.id,
      update: input.update,
      workspaceId: workspace.id,
    });

    return fromFlatFrontComponentToFrontComponentDto(flatFrontComponent);
  }

  // Permanently removes a front component.
  @Mutation(() => FrontComponentDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.APPLICATIONS))
  async deleteFrontComponent(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FrontComponentDTO> {
    const flatFrontComponent = await this.frontComponentService.destroyOne({
      id,
      workspaceId: workspace.id,
    });

    return fromFlatFrontComponentToFrontComponentDto(flatFrontComponent);
  }
}
