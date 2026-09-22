import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Permission flag properties that can be mutated after creation (used by flat-entity diffing/update logic).
export const FLAT_PERMISSION_FLAG_EDITABLE_PROPERTIES = [
  'label',
  'description',
  'icon',
  'permissionType',
] as const satisfies MetadataEntityPropertyName<'permissionFlag'>[];
