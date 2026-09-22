// One cached version of an entity's data, tracked for stale-version
// eviction by when it was last read.
export type CoreEntityVersionEntry<T> = {
  data: T;
  lastReadAt: number;
};

// A local in-process cache entry for one entity: its known versions
// (keyed by Redis content hash) plus the latest hash and when it was last
// validated against Redis.
export type CoreEntityLocalCacheEntry<T> = {
  versions: Map<string, CoreEntityVersionEntry<T>>;
  latestHash: string;
  lastHashCheckedAt: number;
};
