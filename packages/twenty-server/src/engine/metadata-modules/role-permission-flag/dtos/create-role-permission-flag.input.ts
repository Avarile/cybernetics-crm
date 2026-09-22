// Input for granting a single permission flag to a role.
export type CreateRolePermissionFlagInput = {
  roleId: string;
  permissionFlagId: string;
  universalIdentifier?: string;
};
