import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Page layout tab properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_PAGE_LAYOUT_TAB_EDITABLE_PROPERTIES = [
  'title',
  'position',
  'icon',
  'layoutMode',
] as const satisfies MetadataEntityPropertyName<'pageLayoutTab'>[];
