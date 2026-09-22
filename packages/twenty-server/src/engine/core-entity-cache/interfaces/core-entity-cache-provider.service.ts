import { Injectable } from '@nestjs/common';

import {
  type CoreEntityCacheDataMap,
  type CoreEntityCacheKeyName,
} from 'src/engine/core-entity-cache/types/core-entity-cache-key.type';

type CoreEntityCacheDataType = CoreEntityCacheDataMap[CoreEntityCacheKeyName];

// Base class for providers that compute the data for one core-entity
// cache key; subclasses are auto-discovered via the @CoreEntityCache
// decorator.
@Injectable()
export abstract class CoreEntityCacheProvider<
  T extends CoreEntityCacheDataType = CoreEntityCacheDataType,
> {
  abstract computeForCache(entityId: string): Promise<T | null>;
}
