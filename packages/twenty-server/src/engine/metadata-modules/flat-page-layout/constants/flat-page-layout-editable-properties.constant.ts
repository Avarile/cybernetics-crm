import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Page layout properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_PAGE_LAYOUT_EDITABLE_PROPERTIES = [
  'name',
  'type',
  'objectMetadataId',
] as const satisfies MetadataEntityPropertyName<'pageLayout'>[];
