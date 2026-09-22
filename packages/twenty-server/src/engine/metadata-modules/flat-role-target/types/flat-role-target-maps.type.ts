import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatRoleTarget } from 'src/engine/metadata-modules/flat-role-target/types/flat-role-target.type';

// Denormalized, id/universal-identifier indexed collection of all flat role targets in a workspace.
export type FlatRoleTargetMaps = FlatEntityMaps<FlatRoleTarget>;
