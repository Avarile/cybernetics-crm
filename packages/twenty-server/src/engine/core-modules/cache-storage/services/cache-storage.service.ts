// Thin, namespaced wrapper around the cache-manager Cache instance, adding
// key prefixing plus Redis-only primitives (sets, hashes, locks, pattern
// scans) not exposed by the generic cache-manager interface.
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

import { type Milliseconds } from 'cache-manager';
import { type RedisCache } from 'cache-manager-redis-yet';

import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';

@Injectable()
export class CacheStorageService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly namespace: CacheStorageNamespace,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cache.get<T>(this.getKey(key));

    return value;
  }

  async set<T>(key: string, value: T, ttl?: Milliseconds) {
    return this.cache.set(this.getKey(key), value, ttl);
  }

  async del(key: string) {
    return this.cache.del(this.getKey(key));
  }

  // Deletes multiple keys, using a single Redis DEL when possible.
  async mdel(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    if (this.isRedisCache()) {
      const prefixedKeys = keys.map((k) => this.getKey(k));

      await (this.cache as RedisCache).store.client.del(prefixedKeys);

      return;
    }

    await Promise.all(keys.map((k) => this.del(k)));
  }

  // Reads multiple keys, using a single Redis MGET when possible.
  async mget<T = unknown>(keys: string[]): Promise<(T | undefined)[]> {
    if (this.isRedisCache()) {
      const prefixedKeys = keys.map((k) => this.getKey(k));
      const values = await (this.cache as RedisCache).store.client.mGet(
        prefixedKeys,
      );

      return values.map((v) => {
        if (v === null || v === undefined) return undefined;
        try {
          return JSON.parse(v) as T;
        } catch {
          return v as T;
        }
      });
    }

    return Promise.all(keys.map((k) => this.get<T>(k)));
  }

  // Writes multiple key/value entries in parallel.
  async mset<T = unknown>(
    entries: Array<{ key: string; value: T; ttl?: Milliseconds }>,
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    await Promise.all(
      entries.map(({ key, value, ttl }) => this.set(key, value, ttl)),
    );
  }

  // Adds values to a set stored at `key` (a native Redis set, or a JSON array
  // fallback for non-Redis stores).
  async setAdd(key: string, value: string[], ttl?: Milliseconds) {
    if (value.length === 0) {
      return;
    }

    if (this.isRedisCache()) {
      await (this.cache as RedisCache).store.client.sAdd(
        this.getKey(key),
        value,
      );

      if (ttl) {
        await (this.cache as RedisCache).store.client.expire(
          this.getKey(key),
          ttl / 1000,
        );
      }

      return;
    }

    const res = await this.get<string[]>(key);

    if (res) {
      await this.set(key, [...res, ...value], ttl);
    } else {
      await this.set(key, value, ttl);
    }
  }

  // Removes values from the set stored at `key`, returning the count removed.
  async setRemove(key: string, values: string[]): Promise<number> {
    if (values.length === 0) {
      return 0;
    }

    if (this.isRedisCache()) {
      return (this.cache as RedisCache).store.client.sRem(
        this.getKey(key),
        values,
      );
    }

    const existing = await this.get<string[]>(key);

    if (!existing) {
      return 0;
    }

    const filtered = existing.filter((v) => !values.includes(v));
    const removed = existing.length - filtered.length;

    await this.set(key, filtered);

    return removed;
  }

  // Sums the sizes of multiple sets.
  async countAllSetMembers(cacheKeys: string[]) {
    return (
      await Promise.all(cacheKeys.map((key) => this.getSetLength(key)))
    ).reduce((acc, setLength) => acc + setLength, 0);
  }

  // Pops (removes and returns) up to `size` members from the set at `key`.
  async setPop(key: string, size = 1) {
    if (this.isRedisCache()) {
      return (this.cache as RedisCache).store.client.sPop(
        this.getKey(key),
        size,
      );
    }

    const res = await this.get<string[]>(key);

    if (res) {
      await this.set(key, res.slice(0, -size));

      return res.slice(-size);
    }

    return [];
  }

  // Returns the number of members in the set at `key`.
  async getSetLength(key: string) {
    if (this.isRedisCache()) {
      return await (this.cache as RedisCache).store.client.sCard(
        this.getKey(key),
      );
    }

    const res = await this.get<string[]>(key);

    return res?.length ?? 0;
  }

  // Returns all members of the set at `key`.
  async setMembers(key: string): Promise<string[]> {
    if (this.isRedisCache()) {
      return (this.cache as RedisCache).store.client.sMembers(this.getKey(key));
    }

    return (await this.get<string[]>(key)) ?? [];
  }

  // Clears the entire underlying cache store (all namespaces).
  async flush() {
    return this.cache.reset();
  }

  // Scans this namespace for keys matching `scanPattern` and deletes them.
  async flushByPattern(scanPattern: string): Promise<void> {
    if (!this.isRedisCache()) {
      throw new Error('flushByPattern is only supported with Redis cache');
    }

    const redisClient = (this.cache as RedisCache).store.client;
    let cursor = 0;

    do {
      const result = await redisClient.scan(cursor, {
        MATCH: `${this.namespace}:${scanPattern}`,
        COUNT: 100,
      });

      const nextCursor = result.cursor;
      const keys = result.keys;

      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      cursor = nextCursor;
    } while (cursor !== 0);
  }

  // Scans this namespace for set keys matching `scanPattern` and sums their
  // cardinalities via a pipelined SCARD.
  async scanAndCountSetMembers(scanPattern: string): Promise<number> {
    if (!this.isRedisCache()) {
      throw new Error(
        'scanAndCountSetMembers is only supported with Redis cache',
      );
    }

    const redisClient = (this.cache as RedisCache).store.client;
    let cursor = 0;
    let totalCount = 0;

    do {
      const result = await redisClient.scan(cursor, {
        MATCH: `${this.namespace}:${scanPattern}`,
        COUNT: 100,
      });

      cursor = result.cursor;
      const keys = result.keys;

      if (keys.length > 0) {
        const pipeline = redisClient.multi();

        for (const key of keys) {
          pipeline.sCard(key);
        }

        const results = await pipeline.exec();

        for (const result of results) {
          if (result instanceof Error) {
            throw result;
          }
          totalCount += result as number;
        }
      }
    } while (cursor !== 0);

    return totalCount;
  }

  // Attempts to atomically claim a lock key using SET NX PX; returns whether
  // it was acquired.
  async acquireLock(key: string, ttl = 1000): Promise<boolean> {
    if (!this.isRedisCache()) {
      throw new Error('acquireLock is only supported with Redis cache');
    }

    const redisClient = (this.cache as RedisCache).store.client;

    const result = await redisClient.set(this.getKey(key), 'lock', {
      NX: true,
      PX: ttl,
    });

    return result === 'OK';
  }

  // Releases a previously acquired lock key.
  async releaseLock(key: string): Promise<void> {
    if (!this.isRedisCache()) {
      throw new Error('releaseLock is only supported with Redis cache');
    }

    await this.del(key);
  }

  // Atomically increments the numeric value at `key` by `increment`.
  async incrBy(key: string, increment: number): Promise<number> {
    if (this.isRedisCache()) {
      return (this.cache as RedisCache).store.client.incrBy(
        this.getKey(key),
        increment,
      );
    }

    const current = (await this.get<number>(key)) ?? 0;
    const newValue = current + increment;

    await this.set(key, newValue);

    return newValue;
  }

  // Returns all field values from the hash stored at `key`.
  async hashGetValues(key: string): Promise<string[]> {
    if (!this.isRedisCache()) {
      throw new Error('hashGetValues is only supported with Redis cache');
    }

    const redisClient = (this.cache as RedisCache).store.client;

    return redisClient.hVals(this.getKey(key));
  }

  // Sets a single field on the hash stored at `key`.
  async hashSet({
    key,
    field,
    value,
  }: {
    key: string;
    field: string;
    value: string;
  }): Promise<number> {
    if (!this.isRedisCache()) {
      throw new Error('hashSet is only supported with Redis cache');
    }

    const redisClient = (this.cache as RedisCache).store.client;

    return redisClient.hSet(this.getKey(key), field, value);
  }

  // Sets a hash field only if the hash key already exists, via a Lua script
  // to keep the check-and-set atomic.
  async hashSetIfExists({
    key,
    field,
    value,
  }: {
    key: string;
    field: string;
    value: string;
  }): Promise<number> {
    if (!this.isRedisCache()) {
      throw new Error('hashSetIfExists is only supported with Redis cache');
    }

    const redisClient = (this.cache as RedisCache).store.client;

    const script = `
if redis.call('EXISTS', KEYS[1]) == 1 then
  return redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
else
  return 0
end`;

    return redisClient.eval(script, {
      keys: [this.getKey(key)],
      arguments: [field, value],
    }) as Promise<number>;
  }

  // Sets a hash field and applies a TTL to the whole hash key atomically.
  async hashSetWithExpire({
    key,
    field,
    value,
    ttlMs,
  }: {
    key: string;
    field: string;
    value: string;
    ttlMs: Milliseconds;
  }): Promise<void> {
    if (!this.isRedisCache()) {
      throw new Error('hashSetWithExpire is only supported with Redis cache');
    }

    const redisClient = (this.cache as RedisCache).store.client;
    const prefixedKey = this.getKey(key);

    await redisClient
      .multi()
      .hSet(prefixedKey, field, value)
      .pExpire(prefixedKey, ttlMs)
      .exec();
  }

  // Deletes a single field from the hash stored at `key`.
  async hashDelete({
    key,
    field,
  }: {
    key: string;
    field: string;
  }): Promise<number> {
    if (!this.isRedisCache()) {
      throw new Error('hashDelete is only supported with Redis cache');
    }

    const redisClient = (this.cache as RedisCache).store.client;

    return redisClient.hDel(this.getKey(key), field);
  }

  // Applies a TTL to `key`, returning whether the key existed.
  async expire(key: string, ttlMs: Milliseconds): Promise<boolean> {
    if (this.isRedisCache()) {
      return (this.cache as RedisCache).store.client.expire(
        this.getKey(key),
        ttlMs / 1000,
      );
    }

    const existing = await this.get(key);

    if (existing !== undefined) {
      await this.set(key, existing, ttlMs);

      return true;
    }

    return false;
  }

  // Detects whether the underlying cache-manager store is the Redis adapter,
  // since several operations (sets, hashes, locks) are Redis-only.
  private isRedisCache() {
    // oxlint-disable-next-line typescript/no-explicit-any
    return (this.cache.store as any)?.name === 'redis';
  }

  // Prefixes a key with the service's namespace, redirecting to a dedicated
  // namespace when running under tests to avoid clobbering real cache data.
  private getKey(key: string) {
    const formattedKey = `${this.namespace}:${key}`;

    if (process.env.NODE_ENV === 'test') {
      return `${CacheStorageNamespace.IntegrationTests}:${formattedKey}`;
    }

    return formattedKey;
  }
}
