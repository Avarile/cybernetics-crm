// Lists ApiKeyEntity properties excluded from the flattened, cached
// representation used by the workspace API key map cache.
import { type ApiKeyEntity } from 'src/engine/core-modules/api-key/api-key.entity';

export const API_KEY_ENTITY_NON_CACHED_PROPERTIES = [
  'workspace',
] as const satisfies ReadonlyArray<keyof ApiKeyEntity>;
