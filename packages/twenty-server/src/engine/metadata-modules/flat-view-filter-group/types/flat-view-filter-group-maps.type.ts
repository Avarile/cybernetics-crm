import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatViewFilterGroup } from 'src/engine/metadata-modules/flat-view-filter-group/types/flat-view-filter-group.type';

// Denormalized, id/universal-identifier indexed collection of all flat view filter groups in a workspace.
export type FlatViewFilterGroupMaps = FlatEntityMaps<FlatViewFilterGroup>;
