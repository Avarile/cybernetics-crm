import { type ConnectionProviderEntity } from 'src/engine/core-modules/application/connection-provider/connection-provider.entity';
import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';

// Flat (denormalized) representation of a ConnectionProviderEntity used during workspace metadata diffing.
export type FlatConnectionProvider = FlatEntityFrom<ConnectionProviderEntity>;
