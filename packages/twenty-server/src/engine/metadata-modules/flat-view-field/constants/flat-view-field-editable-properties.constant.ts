import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Properties of a flat view field that can be directly edited (and
// therefore become override candidates when a non-owning app edits them).
export const FLAT_VIEW_FIELD_EDITABLE_PROPERTIES = [
  'isVisible',
  'size',
  'position',
  'aggregateOperation',
  'viewFieldGroupId',
] as const satisfies MetadataEntityPropertyName<'viewField'>[];
