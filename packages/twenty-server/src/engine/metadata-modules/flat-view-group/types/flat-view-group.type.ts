import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type ViewGroupEntity } from 'src/engine/metadata-modules/view-group/entities/view-group.entity';

// Flat (denormalized) representation of a ViewGroupEntity used during workspace metadata diffing.
export type FlatViewGroup = FlatEntityFrom<ViewGroupEntity>;
