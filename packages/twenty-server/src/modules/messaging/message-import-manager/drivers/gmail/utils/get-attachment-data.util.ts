import { type gmail_v1 as gmailV1 } from 'googleapis';

// Extracts attachment metadata (filename, Gmail attachment id, mime type,
// size) from a Gmail message's top-level parts.
export const getAttachmentData = (message: gmailV1.Schema$Message) => {
  return (
    message.payload?.parts
      ?.filter((part) => part.filename && part.body?.attachmentId)
      .map((part) => ({
        filename: part.filename ?? '',
        id: part.body?.attachmentId ?? '',
        mimeType: part.mimeType ?? '',
        size: part.body?.size ?? 0,
      })) ?? []
  );
};
