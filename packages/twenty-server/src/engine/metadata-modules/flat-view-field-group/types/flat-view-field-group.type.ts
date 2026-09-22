import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type ViewFieldGroupEntity } from 'src/engine/metadata-modules/view-field-group/entities/view-field-group.entity';

// Flat (denormalized) representation of a ViewFieldGroupEntity used during workspace metadata diffing.
export type FlatViewFieldGroup = FlatEntityFrom<ViewFieldGroupEntity>;
