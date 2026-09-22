// Type guard identifying an asymmetrically-signed JWT header.
import { isNonEmptyString } from '@sniptt/guards';
import * as jwt from 'jsonwebtoken';
import { isDefined } from 'twenty-shared/utils';

import { JWT_ASYMMETRIC_ALGORITHM } from 'src/engine/core-modules/jwt/constants/jwt-algorithm.constant';

// Type guard: a JWT header identifies an asymmetrically-signed token when it
// carries a key id (kid) and uses the asymmetric algorithm.
export const isAsymmetricJwtHeader = (
  header: jwt.JwtHeader | undefined,
): header is jwt.JwtHeader & {
  kid: string;
  alg: typeof JWT_ASYMMETRIC_ALGORITHM;
} =>
  isDefined(header) &&
  isNonEmptyString(header.kid) &&
  header.alg === JWT_ASYMMETRIC_ALGORITHM;
