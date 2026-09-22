import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type PageLayoutEntity } from 'src/engine/metadata-modules/page-layout/entities/page-layout.entity';

// Flat (denormalized) representation of a PageLayoutEntity used during workspace metadata diffing.
export type FlatPageLayout = FlatEntityFrom<PageLayoutEntity>;
