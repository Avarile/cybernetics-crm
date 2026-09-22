// Standard folders that are never created/synced as message folders,
// regardless of the workspace's folder import policy.
import { StandardFolder } from 'src/modules/messaging/message-import-manager/drivers/types/standard-folder';

export const MESSAGING_FOLDER_MANAGER_ALWAYS_EXCLUDED_FOLDERS = [
  StandardFolder.TRASH,
  StandardFolder.JUNK,
];
