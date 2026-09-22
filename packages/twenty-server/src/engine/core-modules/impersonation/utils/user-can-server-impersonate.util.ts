import { type ImpersonationAuthorizationUser } from 'src/engine/core-modules/impersonation/utils/impersonation-authorization-user.type';

// Whether the user has the server-wide right to impersonate other users.
export const userCanServerImpersonate = (
  user: ImpersonationAuthorizationUser,
): boolean => user.canImpersonate === true;
