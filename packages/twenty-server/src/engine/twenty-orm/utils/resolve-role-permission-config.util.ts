import { isDefined } from 'twenty-shared/utils';

import { isSystemAuthContext } from 'src/engine/core-modules/auth/guards/is-system-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type UserWorkspaceRoleMap } from 'src/engine/metadata-modules/role-target/types/user-workspace-role-map';
import { type RolePermissionConfig } from 'src/engine/twenty-orm/types/role-permission-config';
import { resolveRoleIdFromAuthContext } from 'src/engine/twenty-orm/utils/resolve-role-id-from-auth-context.util';

export const resolveRolePermissionConfig = ({
  authContext,
  userWorkspaceRoleMap,
  apiKeyRoleMap,
}: {
  authContext: WorkspaceAuthContext;
  userWorkspaceRoleMap: UserWorkspaceRoleMap;
  apiKeyRoleMap: Record<string, string>;
}): RolePermissionConfig | null => {
  if (isSystemAuthContext(authContext)) {
    return { shouldBypassPermissionChecks: true };
  }

  const roleId = resolveRoleIdFromAuthContext({
    authContext,
    userWorkspaceRoleMap,
    apiKeyRoleMap,
  });

  // null (no resolvable role, and not system auth) is distinct from bypass: callers
  // treat it as "no permissions" rather than "all permissions".
  if (!isDefined(roleId)) {
    return null;
  }

  // Wrapped as a single-role intersection so callers that combine several roles'
  // permissions (see computePermissionIntersection) share one code path with the
  // common single-role case.
  return { intersectionOf: [roleId] };
};
