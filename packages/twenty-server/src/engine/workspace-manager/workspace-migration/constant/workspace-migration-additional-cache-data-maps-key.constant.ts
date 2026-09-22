import { type AdditionalCacheDataMaps } from 'src/engine/workspace-cache/types/workspace-cache-key.type';

// Cache data map keys (beyond the per-metadata flat entity maps) that workspace migration builds
// also need loaded from the workspace cache
export const WORKSPACE_MIGRATION_ADDITIONAL_CACHE_DATA_MAPS_KEY = [
  'featureFlagsMap',
] as const satisfies (keyof AdditionalCacheDataMaps)[];
