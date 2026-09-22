import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FieldPermissionEntity } from 'src/engine/metadata-modules/object-permission/field-permission/field-permission.entity';

// Flat (denormalized) representation of a FieldPermissionEntity used during workspace metadata diffing.
export type FlatFieldPermission = FlatEntityFrom<FieldPermissionEntity>;
