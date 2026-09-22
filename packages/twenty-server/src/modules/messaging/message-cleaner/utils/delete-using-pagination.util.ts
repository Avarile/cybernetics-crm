// Repeatedly fetches a page of ids via `getterPaginated` and deletes them
// via `deleter` until a page comes back empty. Note: always requests
// offset 0, relying on each delete to shrink the result set so the next
// page picks up the following rows.
import { type WorkspaceEntityManager } from 'src/engine/twenty-orm/entity-manager/workspace-entity-manager';

export const deleteUsingPagination = async (
  workspaceId: string,
  batchSize: number,
  getterPaginated: (
    limit: number,
    offset: number,
    workspaceId: string,
    transactionManager?: WorkspaceEntityManager,
  ) => Promise<string[]>,
  deleter: (
    ids: string[],
    workspaceId: string,
    transactionManager?: WorkspaceEntityManager,
  ) => Promise<void>,
  transactionManager?: WorkspaceEntityManager,
) => {
  let hasMoreData = true;

  while (hasMoreData) {
    const idsToDelete = await getterPaginated(
      batchSize,
      0,
      workspaceId,
      transactionManager,
    );

    if (idsToDelete.length > 0) {
      await deleter(idsToDelete, workspaceId, transactionManager);
    } else {
      hasMoreData = false;
    }
  }
};
