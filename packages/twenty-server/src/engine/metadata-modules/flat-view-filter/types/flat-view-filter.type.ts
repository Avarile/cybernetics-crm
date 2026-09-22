import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type ViewFilterEntity } from 'src/engine/metadata-modules/view-filter/entities/view-filter.entity';

// Flat (denormalized) representation of a ViewFilterEntity used during workspace metadata diffing.
export type FlatViewFilter = FlatEntityFrom<ViewFilterEntity>;
