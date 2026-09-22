import { isNonEmptyString } from '@sniptt/guards';

import { mimeEncode } from 'src/modules/messaging/message-import-manager/utils/mime-encode.util';

// Builds a "From" header value, MIME-encoding the display name (if any)
// so non-ASCII names render correctly.
export const formatMessageFromHeader = ({
  fromEmail,
  fromName,
}: {
  fromEmail: string;
  fromName?: string | null;
}) => {
  return isNonEmptyString(fromName)
    ? `${mimeEncode(fromName)} <${fromEmail}>`
    : fromEmail;
};
