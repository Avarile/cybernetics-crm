import { type ImpersonationAuthorizationUser } from 'src/engine/core-modules/impersonation/utils/impersonation-authorization-user.type';
import { userCanServerImpersonate } from 'src/engine/core-modules/impersonation/utils/user-can-server-impersonate.util';
import { userIsFullAdmin } from 'src/engine/core-modules/impersonation/utils/user-is-full-admin.util';

// Whether the user has admin-level privileges: either server impersonation
// rights or full admin panel access.
export const userHasAdminPrivileges = (
  user: ImpersonationAuthorizationUser,
): boolean => userCanServerImpersonate(user) || userIsFullAdmin(user);
