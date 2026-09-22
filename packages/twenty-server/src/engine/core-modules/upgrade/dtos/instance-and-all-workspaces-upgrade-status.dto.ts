import { Field, Int, ObjectType } from '@nestjs/graphql';

import { InstanceUpgradeStatusDTO } from 'src/engine/core-modules/upgrade/dtos/instance-upgrade-status.dto';
import { WorkspaceUpgradeRefDTO } from 'src/engine/core-modules/upgrade/dtos/workspace-upgrade-ref.dto';

// Aggregate upgrade health snapshot: the instance plus every workspace grouped
// by whether they're behind, failed, or up to date
@ObjectType('InstanceAndAllWorkspacesUpgradeStatus')
export class InstanceAndAllWorkspacesUpgradeStatusDTO {
  @Field(() => InstanceUpgradeStatusDTO)
  instanceUpgradeStatus: InstanceUpgradeStatusDTO;

  @Field(() => [WorkspaceUpgradeRefDTO])
  workspacesBehind: WorkspaceUpgradeRefDTO[];

  @Field(() => [WorkspaceUpgradeRefDTO])
  workspacesFailed: WorkspaceUpgradeRefDTO[];

  @Field(() => Int)
  upToDateWorkspaceCount: number;

  @Field(() => Date)
  computedAt: Date;
}
