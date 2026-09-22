import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Skill properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_SKILL_EDITABLE_PROPERTIES = [
  'name',
  'label',
  'icon',
  'description',
  'content',
  'isActive',
] as const satisfies MetadataEntityPropertyName<'skill'>[];
