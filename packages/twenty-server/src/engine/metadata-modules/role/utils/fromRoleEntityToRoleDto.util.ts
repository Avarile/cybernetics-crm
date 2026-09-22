import { PermissionFlagType } from 'twenty-shared/constants';

import { type RoleDTO } from 'src/engine/metadata-modules/role/dtos/role.dto';
import { type RoleEntity } from 'src/engine/metadata-modules/role/role.entity';

// Converts a role TypeORM entity (with its loaded relations) into a
// RoleDTO, including its role targets, permission flags, and object/field
// permissions.
export const fromRoleEntityToRoleDto = (role: RoleEntity): RoleDTO => {
  return {
    id: role.id,
    label: role.label,
    universalIdentifier: role.universalIdentifier,
    canUpdateAllSettings: role.canUpdateAllSettings,
    canAccessAllTools: role.canAccessAllTools,
    description: role.description ?? undefined,
    icon: role.icon ?? undefined,
    isEditable: role.isEditable,
    canReadAllObjectRecords: role.canReadAllObjectRecords,
    canUpdateAllObjectRecords: role.canUpdateAllObjectRecords,
    canSoftDeleteAllObjectRecords: role.canSoftDeleteAllObjectRecords,
    canDestroyAllObjectRecords: role.canDestroyAllObjectRecords,
    canBeAssignedToUsers: role.canBeAssignedToUsers,
    canBeAssignedToAgents: role.canBeAssignedToAgents,
    canBeAssignedToApiKeys: role.canBeAssignedToApiKeys,
    roleTargets: role.roleTargets,
    permissionFlags: role.rolePermissionFlags?.map((rolePermissionFlag) => ({
      id: rolePermissionFlag.id,
      roleId: rolePermissionFlag.roleId,
      flag: rolePermissionFlag.permissionFlag.key as PermissionFlagType,
    })),
    objectPermissions: role.objectPermissions,
    fieldPermissions: role.fieldPermissions,
  };
};

// Maps fromRoleEntityToRoleDto over a list of role entities.
export const fromRoleEntitiesToRoleDtos = (roleEntities: RoleEntity[]) =>
  roleEntities.map(fromRoleEntityToRoleDto);
