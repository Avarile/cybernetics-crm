import { type ImpersonationAuthorizationUser } from 'src/engine/core-modules/impersonation/utils/impersonation-authorization-user.type';

// Whether the user has full admin panel access.
export const userIsFullAdmin = (
  user: ImpersonationAuthorizationUser,
): boolean => user.canAccessFullAdminPanel === true;
