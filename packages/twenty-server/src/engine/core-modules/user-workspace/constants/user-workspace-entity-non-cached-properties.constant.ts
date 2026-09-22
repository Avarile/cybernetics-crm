import { type UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';

// UserWorkspaceEntity fields excluded from the cached FlatUserWorkspace
// projection (relations and computed permission fields resolved separately).
export const USER_WORKSPACE_ENTITY_NON_CACHED_PROPERTIES = [
  'workspace',
  'user',
  'twoFactorAuthenticationMethods',
  'permissionFlags',
  'objectPermissions',
  'objectsPermissions',
  'twoFactorAuthenticationMethodSummary',
] as const satisfies ReadonlyArray<keyof UserWorkspaceEntity>;
