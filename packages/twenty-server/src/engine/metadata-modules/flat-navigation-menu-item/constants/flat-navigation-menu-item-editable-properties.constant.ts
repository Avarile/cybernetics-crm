import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Navigation menu item properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_NAVIGATION_MENU_ITEM_EDITABLE_PROPERTIES = [
  'position',
  'folderId',
  'name',
  'link',
  'icon',
  'color',
  'pageLayoutId',
] as const satisfies MetadataEntityPropertyName<'navigationMenuItem'>[];
