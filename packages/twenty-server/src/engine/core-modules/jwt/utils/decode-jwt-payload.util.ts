import * as jwt from 'jsonwebtoken';
import { isDefined } from 'twenty-shared/utils';

// Decodes a JWT's payload without verifying its signature, returning
// undefined for a malformed token.
export const decodeJwtPayload = <T>(rawJwtToken: string): T | undefined => {
  try {
    const decoded = jwt.decode(rawJwtToken, { json: true });

    if (!isDefined(decoded)) {
      return undefined;
    }

    return decoded as T;
  } catch {
    return undefined;
  }
};
