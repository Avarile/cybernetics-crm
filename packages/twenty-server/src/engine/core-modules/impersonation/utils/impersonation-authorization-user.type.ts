// Subset of user fields needed to evaluate impersonation privilege checks.
export type ImpersonationAuthorizationUser = {
  canImpersonate: boolean;
  canAccessFullAdminPanel: boolean;
};
