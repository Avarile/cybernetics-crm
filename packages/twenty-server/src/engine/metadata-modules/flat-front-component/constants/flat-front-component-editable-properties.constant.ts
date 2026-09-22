import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Front component properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_FRONT_COMPONENT_EDITABLE_PROPERTIES = [
  'name',
  'description',
  'builtComponentChecksum',
  'sourceComponentPath',
  'builtComponentPath',
  'componentName',
  'isHeadless',
] as const satisfies MetadataEntityPropertyName<'frontComponent'>[];
