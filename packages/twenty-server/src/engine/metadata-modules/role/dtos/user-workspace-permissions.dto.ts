import { type UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';

// Subset of a user workspace's resolved permissions (object permissions,
// permission flags) exposed to API consumers.
export type UserWorkspacePermissionsDto = Pick<
  UserWorkspaceEntity,
  'objectPermissions' | 'permissionFlags' | 'objectsPermissions'
>;
