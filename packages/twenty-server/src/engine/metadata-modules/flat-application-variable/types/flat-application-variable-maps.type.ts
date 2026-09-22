import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatApplicationVariable } from 'src/engine/metadata-modules/flat-application-variable/types/flat-application-variable.type';

// Denormalized, id/universal-identifier indexed collection of all flat application variables in a workspace.
export type FlatApplicationVariableMaps =
  FlatEntityMaps<FlatApplicationVariable>;
