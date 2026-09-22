import { SECRET_ENCRYPTION_ENVELOPE_PREFIX } from 'src/engine/core-modules/secret-encryption/constants/secret-encryption.constant';
import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';

// A string is considered encrypted if it carries the envelope prefix
export const isEncryptedString = (value: string): value is EncryptedString =>
  value.startsWith(SECRET_ENCRYPTION_ENVELOPE_PREFIX);
