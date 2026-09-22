import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';

// Lookup maps of all flat view fields in a workspace, indexed by id and
// by universal identifier.
export type FlatViewFieldMaps = FlatEntityMaps<FlatViewField>;
