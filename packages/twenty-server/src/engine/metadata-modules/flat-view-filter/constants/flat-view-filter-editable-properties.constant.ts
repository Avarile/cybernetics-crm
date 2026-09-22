import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// View filter properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_VIEW_FILTER_EDITABLE_PROPERTIES = [
  'fieldMetadataId',
  'operand',
  'value',
  'viewFilterGroupId',
  'positionInViewFilterGroup',
  'subFieldName',
  'relationTargetFieldMetadataId',
] as const satisfies MetadataEntityPropertyName<'viewFilter'>[];
