import * as jwt from 'jsonwebtoken';
import { isDefined } from 'twenty-shared/utils';

// Decodes a JWT's header without verifying its signature, returning
// undefined for a malformed token.
export const decodeJwtHeader = (
  rawJwtToken: string,
): jwt.JwtHeader | undefined => {
  try {
    const decoded = jwt.decode(rawJwtToken, { complete: true });

    if (!isDefined(decoded)) {
      return undefined;
    }

    return decoded.header;
  } catch {
    return undefined;
  }
};
