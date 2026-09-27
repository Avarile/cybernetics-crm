type RoleId = string;

// unionOf is only implemented for a single role (WorkspaceEntityManager.getRepository
// throws for more than one) — intersectionOf is the one actually used for combining
// multiple roles' permissions, via computePermissionIntersection.
export type RolePermissionConfig =
  | { shouldBypassPermissionChecks: true }
  | { unionOf: RoleId[] }
  | { intersectionOf: RoleId[] };
