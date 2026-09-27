import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';
import { DatabaseRecordSnapshotRefreshJob } from 'src/modules/database-record/jobs/database-record-snapshot-refresh.job';
import { type DatabaseConnectionService } from 'src/modules/database-record/services/database-connection.service';
import { type DatabaseRecordAttachmentService } from 'src/modules/database-record/services/database-record-attachment.service';

const WORKSPACE_ID = 'workspace-id';

const buildJob = ({
  staleTargets,
  buildRefreshUpdate,
  getActiveConnectionOrThrow = jest.fn().mockResolvedValue({}),
}: {
  staleTargets: { id: string }[];
  buildRefreshUpdate: jest.Mock;
  getActiveConnectionOrThrow?: jest.Mock;
}) => {
  const repository = {
    find: jest.fn().mockResolvedValue(staleTargets),
    update: jest.fn(),
  };

  const job = new DatabaseRecordSnapshotRefreshJob(
    {
      executeInWorkspaceContext: jest.fn((callback: () => unknown) =>
        callback(),
      ),
      getRepository: jest.fn().mockResolvedValue(repository),
    } as unknown as GlobalWorkspaceOrmManager,
    { getActiveConnectionOrThrow } as unknown as DatabaseConnectionService,
    { buildRefreshUpdate } as unknown as DatabaseRecordAttachmentService,
  );

  return { job, repository };
};

describe('DatabaseRecordSnapshotRefreshJob', () => {
  it('should store each refreshed snapshot', async () => {
    const buildRefreshUpdate = jest
      .fn()
      .mockResolvedValueOnce({ snapshotStatus: 'OK', snapshotAt: 'now' })
      .mockResolvedValueOnce({ snapshotStatus: 'MISSING', snapshotAt: 'now' });

    const { job, repository } = buildJob({
      staleTargets: [{ id: 'target-1' }, { id: 'target-2' }],
      buildRefreshUpdate,
    });

    await job.handle({ workspaceId: WORKSPACE_ID });

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'target-1' },
      { snapshotStatus: 'OK', snapshotAt: 'now' },
    );
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'target-2' },
      { snapshotStatus: 'MISSING', snapshotAt: 'now' },
    );
  });

  it('should mark a record-level failure STALE and bump snapshotAt so it rotates out of the batch', async () => {
    const buildRefreshUpdate = jest
      .fn()
      .mockRejectedValueOnce(
        new DatabaseCentreException(
          'bad request',
          DatabaseCentreExceptionCode.UPSTREAM_BAD_REQUEST,
        ),
      )
      .mockResolvedValueOnce({ snapshotStatus: 'OK', snapshotAt: 'now' });

    const { job, repository } = buildJob({
      staleTargets: [{ id: 'target-1' }, { id: 'target-2' }],
      buildRefreshUpdate,
    });

    await job.handle({ workspaceId: WORKSPACE_ID });

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'target-1' },
      { snapshotStatus: 'STALE', snapshotAt: expect.any(String) },
    );
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'target-2' },
      { snapshotStatus: 'OK', snapshotAt: 'now' },
    );
  });

  it('should stop the run on connection-level failures without touching records', async () => {
    const buildRefreshUpdate = jest
      .fn()
      .mockRejectedValue(
        new DatabaseCentreException(
          'down',
          DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
        ),
      );

    const { job, repository } = buildJob({
      staleTargets: [{ id: 'target-1' }, { id: 'target-2' }],
      buildRefreshUpdate,
    });

    await job.handle({ workspaceId: WORKSPACE_ID });

    expect(buildRefreshUpdate).toHaveBeenCalledTimes(1);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should skip workspaces without a usable connection', async () => {
    const buildRefreshUpdate = jest.fn();

    const { job, repository } = buildJob({
      staleTargets: [{ id: 'target-1' }],
      buildRefreshUpdate,
      getActiveConnectionOrThrow: jest
        .fn()
        .mockRejectedValue(
          new DatabaseCentreException(
            'disabled',
            DatabaseCentreExceptionCode.CONNECTION_DISABLED,
          ),
        ),
    });

    await job.handle({ workspaceId: WORKSPACE_ID });

    expect(buildRefreshUpdate).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should not contact the data centre when nothing is stale', async () => {
    const getActiveConnectionOrThrow = jest.fn();

    const { job } = buildJob({
      staleTargets: [],
      buildRefreshUpdate: jest.fn(),
      getActiveConnectionOrThrow,
    });

    await job.handle({ workspaceId: WORKSPACE_ID });

    expect(getActiveConnectionOrThrow).not.toHaveBeenCalled();
  });
});
