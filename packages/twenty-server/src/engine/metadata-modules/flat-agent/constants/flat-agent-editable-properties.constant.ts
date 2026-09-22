import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Agent properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_AGENT_EDITABLE_PROPERTIES = [
  'name',
  'label',
  'icon',
  'description',
  'prompt',
  'modelId',
  'responseFormat',
  'modelConfiguration',
  'evaluationInputs',
] as const satisfies MetadataEntityPropertyName<'agent'>[];
