import { SECRET_ENCRYPTION_ENVELOPE_V2_PREFIX } from 'src/engine/core-modules/secret-encryption/constants/secret-encryption.constant';

// Envelope format is "enc:v2:{keyId}:{payloadBase64}"; trailing "%" makes this a SQL
// LIKE pattern matching any secret already encrypted with this key id, regardless of payload.
export const buildCurrentEncryptionKeyIdEnvelopeLikePattern = (
  currentEncryptionKeyId: string,
): string =>
  `${SECRET_ENCRYPTION_ENVELOPE_V2_PREFIX}${currentEncryptionKeyId}:%`;
