import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Webhook properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_WEBHOOK_EDITABLE_PROPERTIES = [
  'targetUrl',
  'operations',
  'description',
  'secret',
] as const satisfies MetadataEntityPropertyName<'webhook'>[];
