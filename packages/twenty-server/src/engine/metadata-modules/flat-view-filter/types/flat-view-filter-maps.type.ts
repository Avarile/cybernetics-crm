import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatViewFilter } from 'src/engine/metadata-modules/flat-view-filter/types/flat-view-filter.type';

// Denormalized, id/universal-identifier indexed collection of all flat view filters in a workspace.
export type FlatViewFilterMaps = FlatEntityMaps<FlatViewFilter>;
