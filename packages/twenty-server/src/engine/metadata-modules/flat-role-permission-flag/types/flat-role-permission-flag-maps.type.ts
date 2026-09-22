import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatRolePermissionFlag } from 'src/engine/metadata-modules/flat-role-permission-flag/types/flat-role-permission-flag.type';

// Denormalized, id/universal-identifier indexed collection of all flat role permission flags in a workspace.
export type FlatRolePermissionFlagMaps = FlatEntityMaps<FlatRolePermissionFlag>;
