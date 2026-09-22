type EmailAddress = string | string[];

// Shared input shape each outbound driver's sendMessage/createDraft take.
export type SendMessageInput = {
  body: string;
  subject: string;
  to: EmailAddress;
  cc?: EmailAddress;
  bcc?: EmailAddress;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
  inReplyTo?: string;
  threadExternalId?: string;
  references?: string[];
};
