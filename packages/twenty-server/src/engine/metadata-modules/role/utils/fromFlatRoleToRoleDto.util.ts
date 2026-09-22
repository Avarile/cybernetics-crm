import { type FlatRole } from 'src/engine/metadata-modules/flat-role/types/flat-role.type';
import { type RoleDTO } from 'src/engine/metadata-modules/role/dtos/role.dto';

// Converts a flat role's scalar fields to a RoleDTO. Relation fields
// (permission flags, targets, etc.) are left for callers/resolvers to
// populate separately.
export const fromFlatRoleToRoleDto = ({
  canAccessAllTools,
  canBeAssignedToAgents,
  canBeAssignedToApiKeys,
  canBeAssignedToUsers,
  canDestroyAllObjectRecords,
  canReadAllObjectRecords,
  canSoftDeleteAllObjectRecords,
  canUpdateAllObjectRecords,
  canUpdateAllSettings,
  id,
  isEditable,
  label,
  description,
  icon,
  universalIdentifier,
}: FlatRole): RoleDTO => {
  return {
    canAccessAllTools,
    canBeAssignedToAgents,
    canBeAssignedToApiKeys,
    canBeAssignedToUsers,
    canDestroyAllObjectRecords,
    canReadAllObjectRecords,
    canSoftDeleteAllObjectRecords,
    canUpdateAllObjectRecords,
    canUpdateAllSettings,
    id,
    isEditable,
    label,
    description: description ?? undefined,
    icon: icon ?? undefined,
    universalIdentifier,
  };
};
