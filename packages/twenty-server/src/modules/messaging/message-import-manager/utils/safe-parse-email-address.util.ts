import { type EmailAddress } from 'src/modules/messaging/message-import-manager/types/email-address';
import { safeParseEmailAddressAddress } from 'src/modules/messaging/message-import-manager/utils/safe-parse-email-address-address.util';

// Re-parses an already-split EmailAddress's raw address string (which may
// still contain a display name, e.g. from Microsoft Graph), falling back
// to an empty address rather than throwing on malformed input.
export const safeParseEmailAddress = (
  emailAddress: EmailAddress,
): EmailAddress => {
  return {
    address: safeParseEmailAddressAddress(emailAddress.address) || '',
    name: emailAddress.name,
  };
};
