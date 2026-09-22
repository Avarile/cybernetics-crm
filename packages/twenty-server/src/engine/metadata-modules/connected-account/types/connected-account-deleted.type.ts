// Payload emitted on the CONNECTED_ACCOUNT_DELETED_EVENT workspace event.
export type ConnectedAccountDeletedEvent = {
  connectedAccountId: string;
  userWorkspaceId: string;
};
