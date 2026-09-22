import { MessageFolderImportPolicy } from 'twenty-shared/types';

// A newly-discovered folder syncs by default only when the channel's
// import policy is set to sync all folders.
export const shouldSyncFolderByDefault = (
  messageFolderImportPolicy: MessageFolderImportPolicy,
): boolean => {
  return messageFolderImportPolicy === MessageFolderImportPolicy.ALL_FOLDERS;
};
