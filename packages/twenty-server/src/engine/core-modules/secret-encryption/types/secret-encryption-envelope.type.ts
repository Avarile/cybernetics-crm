// Result of parsing a secret envelope string; version null means it wasn't
// a recognized versioned envelope (legacy or plaintext)
export type ParsedSecretEncryptionEnvelope =
  | { version: 2; keyId: string; payload: string }
  | { version: null };
