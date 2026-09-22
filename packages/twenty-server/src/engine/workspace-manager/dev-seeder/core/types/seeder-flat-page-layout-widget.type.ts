// Subset of FlatPageLayoutWidget fields needed to define seeded dashboard
// widgets.
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';

export type SeederFlatPageLayoutWidget = Pick<
  FlatPageLayoutWidget,
  | 'id'
  | 'pageLayoutTabId'
  | 'title'
  | 'type'
  | 'gridPosition'
  | 'position'
  | 'configuration'
  | 'objectMetadataId'
  | 'overrides'
>;
