import { MessageParticipantRole } from 'twenty-shared/types';

import { type Participant } from 'src/modules/messaging/message-import-manager/drivers/gmail/types/gmail-message.type';
import { type EmailAddress } from 'src/modules/messaging/message-import-manager/types/email-address';
import { formatAddressObjectAsParticipants } from 'src/modules/messaging/message-import-manager/utils/format-address-object-as-participants.util';

// Builds REPLY_TO participants from a message's Reply-To addresses,
// excluding any that duplicate the sender (Reply-To == From is common and
// shouldn't produce a redundant participant).
export const buildReplyToParticipants = (
  replyTo: EmailAddress[] | undefined,
  from: EmailAddress | undefined,
): Participant[] => {
  const senderHandle = from?.address?.toLowerCase();

  const replyToExcludingSender = (replyTo ?? []).filter(
    (emailAddress) => emailAddress.address.toLowerCase() !== senderHandle,
  );

  return formatAddressObjectAsParticipants(
    replyToExcludingSender,
    MessageParticipantRole.REPLY_TO,
  );
};
