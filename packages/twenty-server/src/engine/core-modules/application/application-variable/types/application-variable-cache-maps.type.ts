import { type FlatApplicationVariable } from 'src/engine/metadata-modules/flat-application-variable/types/flat-application-variable.type';
import type { FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';

// Flat entity maps type for cached application variables.
export type ApplicationVariableCacheMaps =
  FlatEntityMaps<FlatApplicationVariable>;
