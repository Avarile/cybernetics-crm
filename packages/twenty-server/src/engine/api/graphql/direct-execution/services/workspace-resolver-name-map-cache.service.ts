// Per-workspace cache provider that precomputes the map of GraphQL
// resolver field names (find/create/update/... per object) to their
// resolver metadata, so direct execution can look up a field's target
// resolver without rebuilding the whole schema on every request.
import { Injectable } from '@nestjs/common';

import { WorkspaceCacheProvider } from 'src/engine/workspace-cache/interfaces/workspace-cache-provider.service';

import {
  type ResolverNameMapEntry,
  buildResolverNameMap,
} from 'src/engine/api/graphql/direct-execution/utils/build-resolver-name-map.util';
import { WorkspaceCache } from 'src/engine/workspace-cache/decorators/workspace-cache.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
@WorkspaceCache('graphQLResolverNameMap')
export class WorkspaceResolverNameMapCacheService extends WorkspaceCacheProvider<
  Record<string, ResolverNameMapEntry>
> {
  constructor(private readonly workspaceCacheService: WorkspaceCacheService) {
    super();
  }

  // Rebuilds the resolver name map for a workspace from its current
  // object metadata, invoked by the cache framework on a cache miss.
  async computeForCache(
    workspaceId: string,
  ): Promise<Record<string, ResolverNameMapEntry>> {
    const { flatObjectMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
      ]);

    return buildResolverNameMap(flatObjectMetadataMaps);
  }
}
