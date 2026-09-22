import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatPermissionFlag } from 'src/engine/metadata-modules/flat-permission-flag/types/flat-permission-flag.type';

// Denormalized, id/universal-identifier indexed collection of all flat permission flags in a workspace.
export type FlatPermissionFlagMaps = FlatEntityMaps<FlatPermissionFlag>;
