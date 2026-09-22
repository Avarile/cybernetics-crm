// Result an outbound driver returns after sending a message.
export type SendMessageResult = {
  headerMessageId: string;
  messageExternalId?: string;
  threadExternalId?: string;
  deliveredRecipients?: { to: string[]; cc: string[]; bcc: string[] };
};
