// Builds the join entity linking a role to a permission flag it grants.
// The universalIdentifier is deterministically derived (uuid v5) from the
// role/permission-flag pair so the same manifest always produces the same
// join row identifier.
import { v5 } from 'uuid';

import { type UniversalFlatRolePermissionFlag } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-role-permission-flag.type';

export const ROLE_PERMISSION_FLAG_UUID_NAMESPACE =
  'b9a3b3b3-58a3-4f6c-9c1f-3a4f6c9c1f3a';

// Converts a role/permission-flag pair into the universal flat
// role-permission-flag join entity, deriving a stable identifier.
export const fromPermissionFlagToUniversalFlatRolePermissionFlag = ({
  permissionFlagUniversalIdentifier,
  roleUniversalIdentifier,
  applicationUniversalIdentifier,
  now,
}: {
  permissionFlagUniversalIdentifier: string;
  roleUniversalIdentifier: string;
  applicationUniversalIdentifier: string;
  now: string;
}): UniversalFlatRolePermissionFlag => {
  const universalIdentifier = v5(
    `${roleUniversalIdentifier}:${permissionFlagUniversalIdentifier}`,
    ROLE_PERMISSION_FLAG_UUID_NAMESPACE,
  );

  return {
    universalIdentifier,
    applicationUniversalIdentifier,
    roleUniversalIdentifier,
    permissionFlagUniversalIdentifier,
    createdAt: now,
    updatedAt: now,
  };
};
