import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';

// Recursively checks whether a type contains an EncryptedString anywhere in its shape
export type ContainsEncryptedString<T> = T extends EncryptedString
  ? true
  : T extends ReadonlyArray<infer U>
    ? ContainsEncryptedString<U>
    : T extends object
      ? true extends {
          [K in keyof T]: ContainsEncryptedString<NonNullable<T[K]>>;
        }[keyof T]
        ? true
        : false
      : false;
