import { type MessageFolder } from 'src/modules/messaging/message-folder-manager/interfaces/message-folder-driver.interface';

import { MessageFolderPendingSyncAction } from 'twenty-shared/types';

import { type MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';

// Merges computed field updates into existing folders in memory and sets
// each folder's pendingSyncAction (FOLDER_DELETION if marked for deletion,
// NONE otherwise) — used to return an up-to-date in-memory folder list
// without re-fetching from the database.
export const computeUpdatedFolders = ({
  existingFolders,
  foldersToUpdate,
  folderIdsToDelete,
}: {
  existingFolders: MessageFolder[];
  foldersToUpdate: Map<string, Partial<MessageFolderEntity>>;
  folderIdsToDelete: string[];
}): MessageFolder[] => {
  return existingFolders.map((existingFolder) => {
    const update = foldersToUpdate.get(existingFolder.id);
    const isMarkedForDeletion = folderIdsToDelete.includes(existingFolder.id);

    const pendingSyncAction = isMarkedForDeletion
      ? MessageFolderPendingSyncAction.FOLDER_DELETION
      : MessageFolderPendingSyncAction.NONE;

    if (update) {
      return {
        ...existingFolder,
        ...update,
        pendingSyncAction,
      };
    }

    return {
      ...existingFolder,
      pendingSyncAction,
    };
  });
};
