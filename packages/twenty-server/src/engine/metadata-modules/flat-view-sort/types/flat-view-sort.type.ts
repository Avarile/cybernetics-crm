import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type ViewSortEntity } from 'src/engine/metadata-modules/view-sort/entities/view-sort.entity';

// Flat (denormalized) representation of a ViewSortEntity used during workspace metadata diffing.
export type FlatViewSort = FlatEntityFrom<ViewSortEntity>;
