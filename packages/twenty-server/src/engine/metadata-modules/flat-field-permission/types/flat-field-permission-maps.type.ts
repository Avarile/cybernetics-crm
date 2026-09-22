import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldPermission } from 'src/engine/metadata-modules/flat-field-permission/types/flat-field-permission.type';

// Denormalized, id/universal-identifier indexed collection of all flat field permissions in a workspace.
export type FlatFieldPermissionMaps = FlatEntityMaps<FlatFieldPermission>;
