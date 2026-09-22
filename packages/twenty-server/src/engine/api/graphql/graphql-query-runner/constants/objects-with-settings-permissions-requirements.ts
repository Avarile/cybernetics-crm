// Maps object names that live under workspace settings (rather than
// regular records) to the permission flag required to query/mutate them,
// used by the query runner to enforce settings-level permissions.
import { PermissionFlagType } from 'twenty-shared/constants';

export const OBJECTS_WITH_SETTINGS_PERMISSIONS_REQUIREMENTS = {
  apiKey: PermissionFlagType.API_KEYS_AND_WEBHOOKS,
  webhook: PermissionFlagType.API_KEYS_AND_WEBHOOKS,
} as const;
