import { z } from 'zod';

// Branded string type marking a value as plaintext, not yet encrypted
export const plaintextStringSchema = z.string().brand('PLAINTEXT_STRING_BRAND');

export type PlaintextString = z.infer<typeof plaintextStringSchema>;
