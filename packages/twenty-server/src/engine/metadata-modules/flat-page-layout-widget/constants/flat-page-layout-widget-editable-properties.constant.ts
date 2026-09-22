// Lists the page layout widget properties that can be changed via create/update
// mutations, used to constrain and validate incoming widget inputs.

import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

export const FLAT_PAGE_LAYOUT_WIDGET_EDITABLE_PROPERTIES = [
  'title',
  'type',
  'objectMetadataId',
  'gridPosition',
  'position',
  'configuration',
  'conditionalDisplay',
  'conditionalAvailabilityExpression',
  'pageLayoutTabId',
] as const satisfies MetadataEntityPropertyName<'pageLayoutWidget'>[];
