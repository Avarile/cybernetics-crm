import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// View sort properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_VIEW_SORT_EDITABLE_PROPERTIES = [
  'direction',
  'subFieldName',
] as const satisfies MetadataEntityPropertyName<'viewSort'>[];
