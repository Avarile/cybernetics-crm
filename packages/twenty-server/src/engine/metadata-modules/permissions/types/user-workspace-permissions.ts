import { type ObjectsPermissions } from 'twenty-shared/types';
import { type PermissionFlagType } from 'twenty-shared/constants';

// A resolved user's effective permission flags and per-object record permissions.
export type UserWorkspacePermissions = {
  permissionFlags: Record<PermissionFlagType, boolean>;
  objectsPermissions: ObjectsPermissions;
};
