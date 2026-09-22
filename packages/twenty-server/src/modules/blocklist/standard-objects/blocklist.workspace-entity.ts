import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

// Standard object: an email/domain handle a workspace member has blocklisted
// so events/messages from it are filtered out of their inbox and calendar.
export class BlocklistWorkspaceEntity extends BaseWorkspaceEntity {
  handle: string | null;
  workspaceMember: EntityRelation<WorkspaceMemberWorkspaceEntity>;
  workspaceMemberId: string;
}
