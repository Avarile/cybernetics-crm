import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Properties of a flat command menu item that can be directly edited (and
// therefore become override candidates when a non-owning app edits them).
export const FLAT_COMMAND_MENU_ITEM_EDITABLE_PROPERTIES = [
  'label',
  'icon',
  'shortLabel',
  'position',
  'isPinned',
  'hotKeys',
  'availabilityType',
  'availabilityObjectMetadataId',
  'engineComponentKey',
  'pageLayoutId',
] as const satisfies MetadataEntityPropertyName<'commandMenuItem'>[];
