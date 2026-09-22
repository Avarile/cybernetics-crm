import { Injectable } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { BlocklistWorkspaceEntity } from 'src/modules/blocklist/standard-objects/blocklist.workspace-entity';

// System-level (permission-bypassing) access to a workspace's blocklist entries.
@Injectable()
export class BlocklistRepository {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  // Fetches a single blocklist entry by id, bypassing permission checks.
  public async getById(
    id: string,
    workspaceId: string,
  ): Promise<BlocklistWorkspaceEntity | null> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const blockListRepository =
          await this.globalWorkspaceOrmManager.getRepository(
            workspaceId,
            BlocklistWorkspaceEntity,
            {
              shouldBypassPermissionChecks: true,
            },
          );

        return blockListRepository.findOneBy({
          id,
        });
      },
      authContext,
    );
  }

  // Fetches all blocklist entries belonging to a given workspace member.
  public async getByWorkspaceMemberId(
    workspaceMemberId: string,
    workspaceId: string,
  ): Promise<BlocklistWorkspaceEntity[]> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const blockListRepository =
          await this.globalWorkspaceOrmManager.getRepository(
            workspaceId,
            BlocklistWorkspaceEntity,
          );

        return blockListRepository.find({
          where: {
            workspaceMemberId,
          },
        });
      },
      authContext,
    );
  }
}
