import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFrontComponent } from 'src/engine/metadata-modules/flat-front-component/types/flat-front-component.type';

// Denormalized, id/universal-identifier indexed collection of all flat front components in a workspace.
export type FlatFrontComponentMaps = FlatEntityMaps<FlatFrontComponent>;
