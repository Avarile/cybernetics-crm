import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type RolePermissionFlagEntity } from 'src/engine/metadata-modules/role-permission-flag/role-permission-flag.entity';

// Flat (denormalized) representation of a RolePermissionFlagEntity used during workspace metadata diffing.
export type FlatRolePermissionFlag = FlatEntityFrom<RolePermissionFlagEntity>;
