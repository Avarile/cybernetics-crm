import addressparser from 'addressparser';

import { type EmailAddress } from 'src/modules/messaging/message-import-manager/types/email-address';

// Parses an email header (e.g. "To") into a list of addresses, returning
// an empty list instead of throwing on malformed input.
export const safeParseEmailAddresses = (header: string): EmailAddress[] => {
  try {
    return addressparser(header)
      .filter((parsed) => parsed.address)
      .map((parsed) => ({
        address: parsed.address,
        name: parsed.name ?? '',
      }));
  } catch {
    return [];
  }
};
