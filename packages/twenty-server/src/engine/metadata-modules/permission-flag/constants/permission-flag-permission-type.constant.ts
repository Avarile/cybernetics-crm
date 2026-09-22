// Whether a permission flag gates a settings page area or a tool an agent/user can invoke.
export const PERMISSION_FLAG_PERMISSION_TYPES = ['settings', 'tool'] as const;

export type PermissionFlagPermissionType =
  (typeof PERMISSION_FLAG_PERMISSION_TYPES)[number];
