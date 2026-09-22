// Core-entity-cache provider resolving a UserWorkspaceEntity by id into its
// flat (cache-friendly) representation.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CoreEntityCache } from 'src/engine/core-entity-cache/decorators/core-entity-cache.decorator';
import { CoreEntityCacheProvider } from 'src/engine/core-entity-cache/interfaces/core-entity-cache-provider.service';
import { type FlatUserWorkspace } from 'src/engine/core-modules/user-workspace/types/flat-user-workspace.type';
import { fromUserWorkspaceEntityToFlat } from 'src/engine/core-modules/user-workspace/utils/from-user-workspace-entity-to-flat.util';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';

@Injectable()
@CoreEntityCache('userWorkspaceEntity')
export class UserWorkspaceEntityCacheProviderService extends CoreEntityCacheProvider<FlatUserWorkspace> {
  constructor(
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {
    super();
  }

  // Loads the user-workspace by id and flattens it for caching.
  async computeForCache(entityId: string): Promise<FlatUserWorkspace | null> {
    const entity = await this.userWorkspaceRepository.findOne({
      where: { id: entityId },
    });

    if (entity === null) {
      return null;
    }

    return fromUserWorkspaceEntityToFlat(entity);
  }
}
