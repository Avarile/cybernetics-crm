// Enforces the "<prefix>-<suffix>" shape that PromiseMemoizer.clearKeys relies on for
// prefix-based bulk invalidation.
export type CacheKey = `${string}-${string}`;
