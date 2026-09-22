import { type MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';

const MAXIMUM_GMAIL_FOLDER_DEPTH = 50;

type FolderInput = Pick<
  MessageFolderEntity,
  'externalId' | 'name' | 'parentFolderId'
>;

// Walks up a folder's parent chain to rebuild its full "/"-joined Gmail
// label path (e.g. "parent/child"), then normalizes it into the lowercase,
// dash-separated form Gmail's search syntax expects for a label: query.
// Returns null if the chain exceeds the max depth (likely a cycle).
export const buildGmailLabelSearchName = (
  folder: FolderInput,
  allFolders: FolderInput[],
): string | null => {
  if (!folder.name) {
    return null;
  }

  const folderMap = new Map(
    allFolders
      .filter((folder) => folder.externalId)
      .map((folder) => [folder.externalId, folder]),
  );

  const pathParts: string[] = [];
  let current: FolderInput | undefined = folder;
  let depth = 0;

  while (current?.name && depth < MAXIMUM_GMAIL_FOLDER_DEPTH) {
    pathParts.unshift(current.name);
    current = current.parentFolderId
      ? folderMap.get(current.parentFolderId)
      : undefined;
    depth++;
  }

  if (depth >= MAXIMUM_GMAIL_FOLDER_DEPTH) {
    return null;
  }

  return pathParts
    .join('/')
    .replace(/[\s/]+/g, '-')
    .toLowerCase();
};
