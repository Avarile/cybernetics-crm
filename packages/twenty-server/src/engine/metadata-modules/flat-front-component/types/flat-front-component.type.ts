import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FrontComponentEntity } from 'src/engine/metadata-modules/front-component/entities/front-component.entity';

// Flat (denormalized) representation of a FrontComponentEntity used during workspace metadata diffing.
export type FlatFrontComponent = FlatEntityFrom<FrontComponentEntity>;
