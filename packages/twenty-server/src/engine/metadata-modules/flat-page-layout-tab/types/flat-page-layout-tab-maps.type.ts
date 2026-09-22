import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';

import { type FlatPageLayoutTab } from './flat-page-layout-tab.type';

// Denormalized, id/universal-identifier indexed collection of all flat page layout tabs in a workspace.
export type FlatPageLayoutTabMaps = FlatEntityMaps<FlatPageLayoutTab>;
