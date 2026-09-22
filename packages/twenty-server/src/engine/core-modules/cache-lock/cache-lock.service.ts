// Service implementing a simple retry-based distributed lock on top of the
// Redis-backed cache storage, used to serialize concurrent operations on the
// same key across processes.
import { Injectable, Logger } from '@nestjs/common';

import {
  CacheLockException,
  CacheLockExceptionCode,
} from 'src/engine/core-modules/cache-lock/exceptions/cache-lock.exception';
import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';

export type CacheLockOptions = {
  ms?: number;
  maxRetries?: number;
  ttl?: number;
};

@Injectable()
export class CacheLockService {
  private readonly logger = new Logger(CacheLockService.name);

  constructor(
    @InjectCacheStorage(CacheStorageNamespace.EngineLock)
    private readonly cacheStorageService: CacheStorageService,
  ) {}

  async delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // Repeatedly attempts to acquire the lock for `key`, running `fn` once
  // acquired and releasing it afterwards. Throws if all retries are exhausted.
  async withLock<T>(
    fn: () => Promise<T>,
    key: string,
    options?: CacheLockOptions,
  ): Promise<T> {
    const { ms = 100, maxRetries = 50, ttl = 5_500 } = options || {};

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const acquired = await this.cacheStorageService.acquireLock(key, ttl);

      if (acquired) {
        try {
          return await fn();
        } finally {
          try {
            await this.cacheStorageService.releaseLock(key);
          } catch (releaseError) {
            this.logger.warn(
              `Failed to release lock for key "${key}": ${releaseError}`,
            );
          }
        }
      }

      await this.delay(ms);
    }

    throw new CacheLockException(
      `Failed to acquire lock for key: ${key}`,
      CacheLockExceptionCode.LOCK_ACQUISITION_TIMEOUT,
    );
  }
}
