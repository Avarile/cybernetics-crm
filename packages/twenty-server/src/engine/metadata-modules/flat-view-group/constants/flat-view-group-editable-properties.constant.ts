import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// View group properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_VIEW_GROUP_EDITABLE_PROPERTIES = [
  'isVisible',
  'fieldValue',
  'position',
] as const satisfies MetadataEntityPropertyName<'viewGroup'>[];
