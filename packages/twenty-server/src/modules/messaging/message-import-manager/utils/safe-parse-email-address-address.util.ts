import { Logger } from '@nestjs/common';

import addressparser from 'addressparser';

// Parses just the address portion of a single email header value,
// logging and returning undefined instead of throwing on malformed input.
export const safeParseEmailAddressAddress = (
  address: string,
): string | undefined => {
  const logger = new Logger(safeParseEmailAddressAddress.name);

  try {
    return addressparser(address)[0].address;
  } catch (error) {
    logger.error(`Error parsing address: ${address}`, error);

    return undefined;
  }
};
