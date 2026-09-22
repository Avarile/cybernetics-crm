import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type ObjectPermissionEntity } from 'src/engine/metadata-modules/object-permission/object-permission.entity';

// Flat (denormalized) representation of an ObjectPermissionEntity used during workspace metadata diffing.
export type FlatObjectPermission = FlatEntityFrom<ObjectPermissionEntity>;
