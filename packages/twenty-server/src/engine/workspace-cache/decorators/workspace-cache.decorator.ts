import { SetMetadata } from '@nestjs/common';

import { type WorkspaceCacheKeyName } from 'src/engine/workspace-cache/types/workspace-cache-key.type';

export type WorkspaceCacheOptions = {
  // When true, the computed data is kept only in each pod's local in-memory cache
  // and never written to Redis (only its version hash is), so every pod recomputes
  // independently on a miss instead of sharing the value across the cluster. Use
  // this for data too large/cheap-to-recompute to be worth replicating via Redis.
  localDataOnly?: boolean;
};

export const WORKSPACE_CACHE_KEY = 'WORKSPACE_CACHE_KEY';
export const WORKSPACE_CACHE_OPTIONS = 'WORKSPACE_CACHE_OPTIONS';

export const WorkspaceCache = (
  workspaceCacheKeyName: WorkspaceCacheKeyName,
  options?: WorkspaceCacheOptions,
): ClassDecorator => {
  return (target) => {
    SetMetadata(WORKSPACE_CACHE_KEY, workspaceCacheKeyName)(target);
    SetMetadata(WORKSPACE_CACHE_OPTIONS, options ?? {})(target);
  };
};
