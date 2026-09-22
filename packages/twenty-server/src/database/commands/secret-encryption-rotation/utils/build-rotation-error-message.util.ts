import {
  SecretEncryptionException,
  SecretEncryptionExceptionCode,
} from 'src/engine/core-modules/secret-encryption/exceptions/secret-encryption.exception';

// Formats a rotation failure into a log-friendly message, with a specific hint
// when the row is encrypted under a key that's neither the current nor fallback key.
export const buildRotationErrorMessage = (
  siteName: string,
  rowId: string,
  error: unknown,
): string => {
  if (
    error instanceof SecretEncryptionException &&
    error.code === SecretEncryptionExceptionCode.UNKNOWN_KEY_ID
  ) {
    return `[${siteName}] row ${rowId}: ${error.message} The row is encrypted with a key that is neither ENCRYPTION_KEY nor FALLBACK_ENCRYPTION_KEY — set FALLBACK_ENCRYPTION_KEY to the key that produced this envelope (e.g. after a partial earlier rotation).`;
  }

  const detail = error instanceof Error ? error.message : String(error);

  return `[${siteName}] row ${rowId}: failed to re-encrypt: ${detail}`;
};
