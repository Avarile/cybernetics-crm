import { createHash } from 'crypto';

// Derives the short key id embedded in an envelope from the raw key, so the
// decrypting key can be identified without storing the key itself
export const computeEncryptionKeyId = ({
  rawKey,
}: {
  rawKey: string;
}): string => createHash('sha256').update(rawKey).digest('hex').slice(0, 8);
