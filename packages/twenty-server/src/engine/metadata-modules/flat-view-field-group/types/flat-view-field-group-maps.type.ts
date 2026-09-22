import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatViewFieldGroup } from 'src/engine/metadata-modules/flat-view-field-group/types/flat-view-field-group.type';

// Denormalized, id/universal-identifier indexed collection of all flat view field groups in a workspace.
export type FlatViewFieldGroupMaps = FlatEntityMaps<FlatViewFieldGroup>;
