import { z } from 'zod';

// Branded string type marking a value as already encrypted, so plaintext and
// ciphertext can't be mixed up at the type level
const encryptedStringSchema = z.string().brand('ENCRYPTED_STRING_BRAND');

export type EncryptedString = z.infer<typeof encryptedStringSchema>;
