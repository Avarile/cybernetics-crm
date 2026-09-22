import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { PROVISIONED_WORKSPACE_ACTIVATION_STATUSES } from 'twenty-shared/workspace';
import { MoreThanOrEqual, QueryRunner, Repository } from 'typeorm';

import { activationStatusIn } from 'src/engine/core-modules/workspace/utils/activation-status-in.util';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

// Queries provisioned workspaces, used by upgrade/version commands that need
// to iterate over active workspaces in batches.
@Injectable()
export class WorkspaceVersionService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  // Checks whether at least one workspace is currently provisioned.
  async hasProvisionedWorkspaces(): Promise<boolean> {
    return this.workspaceRepository.exists({
      where: {
        activationStatus: activationStatusIn(
          PROVISIONED_WORKSPACE_ACTIVATION_STATUSES,
        ),
      },
    });
  }

  // Fetches provisioned workspace ids in id order, optionally starting after
  // a given id and capped at a limit, to support paginated iteration.
  async getProvisionedWorkspaceIds({
    startFromWorkspaceId,
    workspaceCountLimit,
    queryRunner,
  }: {
    startFromWorkspaceId?: string;
    workspaceCountLimit?: number;
    queryRunner?: QueryRunner;
  } = {}): Promise<string[]> {
    const repository = queryRunner
      ? queryRunner.manager.getRepository(WorkspaceEntity)
      : this.workspaceRepository;

    const workspaces = await repository.find({
      select: ['id'],
      where: {
        activationStatus: activationStatusIn(
          PROVISIONED_WORKSPACE_ACTIVATION_STATUSES,
        ),
        ...(startFromWorkspaceId
          ? { id: MoreThanOrEqual(startFromWorkspaceId) }
          : {}),
      },
      order: { id: 'ASC' },
      take: workspaceCountLimit,
    });

    return workspaces.map((workspace) => workspace.id);
  }
}
