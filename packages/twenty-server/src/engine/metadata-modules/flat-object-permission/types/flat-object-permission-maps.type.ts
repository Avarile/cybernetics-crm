import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatObjectPermission } from 'src/engine/metadata-modules/flat-object-permission/types/flat-object-permission.type';

// Denormalized, id/universal-identifier indexed collection of all flat object permissions in a workspace.
export type FlatObjectPermissionMaps = FlatEntityMaps<FlatObjectPermission>;
