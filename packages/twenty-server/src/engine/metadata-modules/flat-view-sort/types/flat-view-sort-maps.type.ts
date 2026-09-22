import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatViewSort } from 'src/engine/metadata-modules/flat-view-sort/types/flat-view-sort.type';

// Denormalized, id/universal-identifier indexed collection of all flat view sorts in a workspace.
export type FlatViewSortMaps = FlatEntityMaps<FlatViewSort>;
