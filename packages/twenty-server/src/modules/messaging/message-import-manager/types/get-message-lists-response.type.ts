// Ids to import/delete for one folder (or the whole channel when
// folderId is undefined), plus the cursor to persist for the next sync.
export type GetOneMessageListResponse = {
  messageExternalIds: string[];
  messageExternalIdsToDelete: string[];
  previousSyncCursor: string | null;
  nextSyncCursor: string;
  folderId: string | undefined;
};

export type GetMessageListsResponse = Array<GetOneMessageListResponse>;
