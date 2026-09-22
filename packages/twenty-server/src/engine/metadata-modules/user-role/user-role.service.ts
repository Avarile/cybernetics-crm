import { InjectRepository } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { In, Repository } from 'typeorm';

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { RoleTargetEntity } from 'src/engine/metadata-modules/role-target/role-target.entity';
import { RoleTargetService } from 'src/engine/metadata-modules/role-target/services/role-target.service';
import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { STANDARD_ROLE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

// Manages role assignment for user workspaces: assigning roles, looking up a user's role,
// and enforcing that a workspace always keeps at least one admin.
export class UserRoleService {
  constructor(
    @InjectWorkspaceScopedRepository(RoleTargetEntity)
    private readonly roleTargetRepository: WorkspaceScopedRepository<RoleTargetEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly roleTargetService: RoleTargetService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  // Assigns a role to each given user workspace (skipping ones that already have it),
  // validating that unassigning an existing admin role won't leave the workspace without
  // an admin.
  public async assignRoleToManyUserWorkspace({
    workspaceId,
    userWorkspaceIds,
    roleId,
  }: {
    workspaceId: string;
    userWorkspaceIds: string[];
    roleId: string;
  }): Promise<void> {
    if (userWorkspaceIds.length === 0) {
      return;
    }

    const userWorkspaceIdsToAssign =
      await this.validateAssignRoleInputsAndGetUserWorkspaceIdsToAssign({
        userWorkspaceIds,
        workspaceId,
        roleId,
      });

    if (userWorkspaceIdsToAssign.length === 0) {
      return;
    }

    await this.roleTargetService.createMany({
      createRoleTargetInputs: userWorkspaceIdsToAssign.map(
        (userWorkspaceId) => ({
          roleId,
          targetId: userWorkspaceId,
          targetMetadataForeignKey: 'userWorkspaceId' as const,
        }),
      ),
      workspaceId,
    });
  }

  // Looks up the role id assigned to a user workspace, throwing if none is assigned.
  public async getRoleIdForUserWorkspace({
    workspaceId,
    userWorkspaceId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
  }): Promise<string> {
    const { userWorkspaceRoleMap } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'userWorkspaceRoleMap',
      ]);

    const roleId = userWorkspaceRoleMap[userWorkspaceId];

    if (!isDefined(roleId)) {
      throw new PermissionsException(
        `User workspace ${userWorkspaceId} has no role assigned`,
        PermissionsExceptionCode.NO_ROLE_FOUND_FOR_USER_WORKSPACE,
      );
    }

    return roleId;
  }

  // Returns each user workspace's assigned roles (with permission flags loaded), keyed by user workspace id.
  public async getRolesByUserWorkspaces({
    userWorkspaceIds,
    workspaceId,
  }: {
    userWorkspaceIds: string[];
    workspaceId: string;
  }): Promise<Map<string, RoleEntity[]>> {
    if (!userWorkspaceIds.length) {
      return new Map();
    }

    const allRoleTargets = await this.roleTargetRepository.find(workspaceId, {
      where: {
        userWorkspaceId: In(userWorkspaceIds),
      },
      relations: {
        role: {
          rolePermissionFlags: {
            permissionFlag: true,
          },
        },
      },
    });

    if (!allRoleTargets.length) {
      return new Map();
    }

    const rolesMap = new Map<string, RoleEntity[]>();

    for (const userWorkspaceId of userWorkspaceIds) {
      const roleTargetsOfUserWorkspace = allRoleTargets.filter(
        (roleTarget) => roleTarget.userWorkspaceId === userWorkspaceId,
      );

      const rolesOfUserWorkspace = roleTargetsOfUserWorkspace
        .map((roleTarget) => roleTarget.role)
        .filter(isDefined);

      rolesMap.set(userWorkspaceId, rolesOfUserWorkspace);
    }

    return rolesMap;
  }

  // Returns the workspace member records for every user assigned to the given role.
  public async getWorkspaceMembersAssignedToRole(
    roleId: string,
    workspaceId: string,
  ): Promise<WorkspaceMemberWorkspaceEntity[]> {
    const authContext = buildSystemAuthContext(workspaceId);

    const userWorkspaceIdsWithRole =
      await this.getUserWorkspaceIdsAssignedToRole(roleId, workspaceId);

    const userIds = await this.userWorkspaceRepository
      .find({
        where: {
          id: In(userWorkspaceIdsWithRole),
        },
      })
      .then((userWorkspaces) =>
        userWorkspaces.map((userWorkspace) => userWorkspace.userId),
      );

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const workspaceMemberRepository =
          await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
            workspaceId,
            'workspaceMember',
            { shouldBypassPermissionChecks: true },
          );

        const workspaceMembers = await workspaceMemberRepository.find({
          where: {
            userId: In(userIds),
          },
        });

        return workspaceMembers;
      },
      authContext,
    );
  }

  // Returns the ids of every user workspace currently assigned the given role.
  public async getUserWorkspaceIdsAssignedToRole(
    roleId: string,
    workspaceId: string,
  ): Promise<string[]> {
    const { userWorkspaceRoleMap } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'userWorkspaceRoleMap',
      ]);

    return Object.entries(userWorkspaceRoleMap)
      .filter(([_, roleIdFromMap]) => roleIdFromMap === roleId)
      .map(([userWorkspaceId]) => userWorkspaceId);
  }

  // Throws if the user workspace is the workspace's sole admin, preventing actions
  // (e.g. removal) that would leave the workspace without an admin.
  public async validateUserWorkspaceIsNotUniqueAdminOrThrow({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const roleOfUserWorkspace = await this.getRolesByUserWorkspaces({
      userWorkspaceIds: [userWorkspaceId],
      workspaceId,
    }).then((roles) => roles.get(userWorkspaceId)?.[0]);

    if (!isDefined(roleOfUserWorkspace)) {
      throw new PermissionsException(
        PermissionsExceptionMessage.NO_ROLE_FOUND_FOR_USER_WORKSPACE,
        PermissionsExceptionCode.NO_ROLE_FOUND_FOR_USER_WORKSPACE,
        {
          userFriendlyMessage: msg`Your role in this workspace could not be found. Please contact your workspace administrator.`,
        },
      );
    }

    if (
      isDefined(roleOfUserWorkspace) &&
      roleOfUserWorkspace.universalIdentifier ===
        STANDARD_ROLE.admin.universalIdentifier
    ) {
      const adminRole = roleOfUserWorkspace;

      await this.validateMoreThanOneWorkspaceMemberHasAdminRoleOrThrow({
        adminRoleId: adminRole.id,
        workspaceId,
      });
    }
  }

  // Validates that every given user workspace exists, filters out ones that already have
  // the target role, and — if any being reassigned currently holds the admin role —
  // validates that reassigning them won't leave the workspace without an admin.
  private async validateAssignRoleInputsAndGetUserWorkspaceIdsToAssign({
    userWorkspaceIds,
    workspaceId,
    roleId,
  }: {
    userWorkspaceIds: string[];
    workspaceId: string;
    roleId: string;
  }): Promise<string[]> {
    const userWorkspaces = await this.userWorkspaceRepository.find({
      where: {
        id: In(userWorkspaceIds),
      },
    });

    const foundUserWorkspaceIds = new Set(
      userWorkspaces.map((userWorkspace) => userWorkspace.id),
    );

    const missingUserWorkspaceIds = userWorkspaceIds.filter(
      (id) => !foundUserWorkspaceIds.has(id),
    );

    if (missingUserWorkspaceIds.length > 0) {
      throw new PermissionsException(
        `User workspaces not found: ${missingUserWorkspaceIds.join(', ')}`,
        PermissionsExceptionCode.USER_WORKSPACE_NOT_FOUND,
        {
          userFriendlyMessage: msg`Some workspace memberships could not be found. They may no longer have access to this workspace.`,
        },
      );
    }

    const rolesByUserWorkspaces = await this.getRolesByUserWorkspaces({
      userWorkspaceIds,
      workspaceId,
    });

    const userWorkspaceIdsToAssign: string[] = [];
    let adminRoleIdToValidate: string | undefined;

    for (const userWorkspaceId of userWorkspaceIds) {
      const currentRole = rolesByUserWorkspaces.get(userWorkspaceId)?.[0];

      if (currentRole?.id === roleId) {
        continue;
      }

      if (
        isDefined(currentRole) &&
        currentRole.universalIdentifier ===
          STANDARD_ROLE.admin.universalIdentifier
      ) {
        adminRoleIdToValidate = currentRole.id;
      }

      userWorkspaceIdsToAssign.push(userWorkspaceId);
    }

    if (isDefined(adminRoleIdToValidate)) {
      await this.validateMoreThanOneWorkspaceMemberHasAdminRoleOrThrow({
        workspaceId,
        adminRoleId: adminRoleIdToValidate,
      });
    }

    return userWorkspaceIdsToAssign;
  }

  // Throws if exactly one workspace member currently holds the admin role, since removing
  // it from them would leave the workspace with no admin.
  private async validateMoreThanOneWorkspaceMemberHasAdminRoleOrThrow({
    adminRoleId,
    workspaceId,
  }: {
    adminRoleId: string;
    workspaceId: string;
  }) {
    const workspaceMembersWithAdminRole =
      await this.getWorkspaceMembersAssignedToRole(adminRoleId, workspaceId);

    if (workspaceMembersWithAdminRole.length === 1) {
      throw new PermissionsException(
        PermissionsExceptionMessage.CANNOT_UNASSIGN_LAST_ADMIN,
        PermissionsExceptionCode.CANNOT_UNASSIGN_LAST_ADMIN,
        {
          userFriendlyMessage: msg`You cannot remove the admin role from the last administrator. Please assign another administrator first.`,
        },
      );
    }
  }
}
