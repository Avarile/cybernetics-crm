import { type UniversalFlatRole } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-role.type';

// Role properties that must always be present on a universal flat role.
export const FLAT_ROLE_REQUIRED_PROPERTIES = [
  'label',
  'canUpdateAllSettings',
  'canAccessAllTools',
  'canReadAllObjectRecords',
  'canUpdateAllObjectRecords',
  'canSoftDeleteAllObjectRecords',
  'canDestroyAllObjectRecords',
] as const satisfies (keyof UniversalFlatRole)[];
