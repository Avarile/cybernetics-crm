import { type MessageWithParticipants } from 'src/modules/messaging/message-import-manager/types/message';

// Drops messages carrying a .ics calendar attachment (typically calendar
// invites, which aren't imported as regular messages).
export const filterOutIcsAttachments = (
  messages: MessageWithParticipants[],
) => {
  return messages.filter((message) => {
    if (!message.attachments) {
      return true;
    }

    return message.attachments.every(
      (attachment) => !attachment.filename.endsWith('.ics'),
    );
  });
};
