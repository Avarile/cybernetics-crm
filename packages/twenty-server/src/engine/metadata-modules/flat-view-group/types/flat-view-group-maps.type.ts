import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';

// Denormalized, id/universal-identifier indexed collection of all flat view groups in a workspace.
export type FlatViewGroupMaps = FlatEntityMaps<FlatViewGroup>;
