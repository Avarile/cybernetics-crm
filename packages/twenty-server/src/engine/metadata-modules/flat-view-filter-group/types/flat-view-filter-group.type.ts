import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type ViewFilterGroupEntity } from 'src/engine/metadata-modules/view-filter-group/entities/view-filter-group.entity';

// Flat (denormalized) representation of a ViewFilterGroupEntity used during workspace metadata diffing.
export type FlatViewFilterGroup = FlatEntityFrom<ViewFilterGroupEntity>;
