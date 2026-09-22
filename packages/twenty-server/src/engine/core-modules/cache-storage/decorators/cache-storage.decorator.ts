// Parameter decorator to inject the CacheStorageService instance registered
// for a given cache namespace.
import { Inject } from '@nestjs/common';

import { type CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';

export const InjectCacheStorage = (
  cacheStorageNamespace: CacheStorageNamespace,
) => {
  return Inject(cacheStorageNamespace);
};
