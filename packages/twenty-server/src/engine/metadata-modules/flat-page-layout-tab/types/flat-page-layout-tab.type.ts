import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type PageLayoutTabEntity } from 'src/engine/metadata-modules/page-layout-tab/entities/page-layout-tab.entity';

// Flat (denormalized) representation of a PageLayoutTabEntity used during workspace metadata diffing.
export type FlatPageLayoutTab = FlatEntityFrom<PageLayoutTabEntity>;
