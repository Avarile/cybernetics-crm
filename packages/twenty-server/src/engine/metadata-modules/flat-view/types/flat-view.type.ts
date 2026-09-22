import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type ViewEntity } from 'src/engine/metadata-modules/view/entities/view.entity';

// Denormalized form of a view, with relation ids resolved to universal
// identifiers, used during metadata diffing/migration building.
export type FlatView = FlatEntityFrom<ViewEntity>;
