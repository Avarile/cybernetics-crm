// The active encryption key plus an optional fallback used during key rotation
export type ResolvedEncryptionKeys = {
  primary: string;
  fallback: string | null;
};
