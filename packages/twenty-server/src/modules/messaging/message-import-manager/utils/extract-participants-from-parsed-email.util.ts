import { type Email as ParsedEmail } from 'postal-mime';
import { MessageParticipantRole } from 'twenty-shared/types';

import { buildReplyToParticipants } from 'src/modules/messaging/message-import-manager/utils/build-reply-to-participants.util';
import { extractAddressesFromParsedEmail } from 'src/modules/messaging/message-import-manager/utils/extract-addresses-from-parsed-email.util';
import { formatAddressObjectAsParticipants } from 'src/modules/messaging/message-import-manager/utils/format-address-object-as-participants.util';

// Builds the full participant list (from/to/cc/bcc/reply-to) for a
// postal-mime parsed email.
export const extractParticipantsFromParsedEmail = (parsed: ParsedEmail) => {
  const addressFields = [
    { field: parsed.from, role: MessageParticipantRole.FROM },
    { field: parsed.to, role: MessageParticipantRole.TO },
    { field: parsed.cc, role: MessageParticipantRole.CC },
    { field: parsed.bcc, role: MessageParticipantRole.BCC },
  ] as const;

  const from = extractAddressesFromParsedEmail(parsed.from)[0];
  const replyTo = extractAddressesFromParsedEmail(parsed.replyTo);

  return [
    ...addressFields.flatMap(({ field, role }) =>
      formatAddressObjectAsParticipants(
        extractAddressesFromParsedEmail(field),
        role,
      ),
    ),
    ...buildReplyToParticipants(replyTo, from),
  ];
};
