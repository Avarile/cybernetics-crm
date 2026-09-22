import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';

// Lookup maps of all flat views in a workspace, indexed by id and by
// universal identifier.
export type FlatViewMaps = FlatEntityMaps<FlatView>;
