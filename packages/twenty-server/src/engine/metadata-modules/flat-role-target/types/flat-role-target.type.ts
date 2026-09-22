import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type RoleTargetEntity } from 'src/engine/metadata-modules/role-target/role-target.entity';

// Flat (denormalized) representation of a RoleTargetEntity used during workspace metadata diffing.
export type FlatRoleTarget = FlatEntityFrom<RoleTargetEntity>;
