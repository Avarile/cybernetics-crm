import { isNonEmptyString } from '@sniptt/guards';

import {
  type DiscoveredMessageFolder,
  type MessageFolder,
} from 'src/modules/messaging/message-folder-manager/interfaces/message-folder-driver.interface';

import { type MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';

// Builds the entity data for discovered folders that have no matching
// existing folder by external id, i.e. newly-found remote folders.
export const computeFoldersToCreate = ({
  discoveredFolders,
  existingFolders,
  messageChannelId,
}: {
  discoveredFolders: DiscoveredMessageFolder[];
  existingFolders: MessageFolder[];
  messageChannelId: string;
}): Partial<MessageFolderEntity>[] => {
  const existingFoldersByExternalId = new Map(
    existingFolders.map((folder) => [folder.externalId, folder]),
  );

  return discoveredFolders
    .filter(
      (discoveredFolder) =>
        !existingFoldersByExternalId.has(discoveredFolder.externalId),
    )
    .map((discoveredFolder) => ({
      name: discoveredFolder.name,
      externalId: discoveredFolder.externalId,
      messageChannelId,
      isSentFolder: discoveredFolder.isSentFolder,
      isSynced: discoveredFolder.isSynced,
      syncCursor: null,
      parentFolderId: isNonEmptyString(discoveredFolder.parentFolderId)
        ? discoveredFolder.parentFolderId
        : null,
    }));
};
