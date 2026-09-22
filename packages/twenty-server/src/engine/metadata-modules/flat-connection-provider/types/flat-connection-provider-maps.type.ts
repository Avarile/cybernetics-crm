import { type FlatConnectionProvider } from 'src/engine/metadata-modules/flat-connection-provider/types/flat-connection-provider.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';

// Denormalized, id/universal-identifier indexed collection of all flat connection providers in a workspace.
export type FlatConnectionProviderMaps = FlatEntityMaps<FlatConnectionProvider>;
