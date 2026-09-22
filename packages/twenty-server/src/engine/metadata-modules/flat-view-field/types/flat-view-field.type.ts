import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type ViewFieldEntity } from 'src/engine/metadata-modules/view-field/entities/view-field.entity';

// Denormalized form of a view field, with relation ids resolved to
// universal identifiers, used during metadata diffing/migration building.
export type FlatViewField = FlatEntityFrom<ViewFieldEntity>;
