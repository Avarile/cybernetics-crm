import { isEmailBlocklisted } from 'src/modules/blocklist/utils/is-email-blocklisted.util';
import { type MessageWithParticipants } from 'src/modules/messaging/message-import-manager/types/message';

// Drops messages where any participant matches a blocklisted handle/domain.
export const filterOutBlocklistedMessages = (
  messageChannelHandles: string[],
  messages: MessageWithParticipants[],
  blocklist: string[],
) => {
  return messages.filter((message) => {
    if (!message.participants) {
      return true;
    }

    return message.participants.every(
      (participant) =>
        !isEmailBlocklisted(
          messageChannelHandles,
          participant.handle,
          blocklist,
        ),
    );
  });
};
