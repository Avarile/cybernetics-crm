import { SetMetadata } from '@nestjs/common';

import { type CoreEntityCacheKeyName } from 'src/engine/core-entity-cache/types/core-entity-cache-key.type';

export const CORE_ENTITY_CACHE_KEY = 'CORE_ENTITY_CACHE_KEY';

// Marks a CoreEntityCacheProvider subclass with the cache key name it
// computes data for, so CoreEntityCacheService can discover and register
// it at startup.
export const CoreEntityCache = (
  coreEntityCacheKeyName: CoreEntityCacheKeyName,
): ClassDecorator => {
  return (target) => {
    SetMetadata(CORE_ENTITY_CACHE_KEY, coreEntityCacheKeyName)(target);
  };
};
