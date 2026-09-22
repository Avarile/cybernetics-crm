import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatPageLayout } from 'src/engine/metadata-modules/flat-page-layout/types/flat-page-layout.type';

// Denormalized, id/universal-identifier indexed collection of all flat page layouts in a workspace.
export type FlatPageLayoutMaps = FlatEntityMaps<FlatPageLayout>;
