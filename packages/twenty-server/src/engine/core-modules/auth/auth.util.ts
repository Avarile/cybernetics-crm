// Password hashing and symmetric encryption helpers used across the auth
// module (password storage, encrypting secrets like OAuth tokens).
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

import * as bcrypt from 'bcrypt';

export const PASSWORD_REGEX = /^.{8,50}$/;

const saltRounds = 10;

// Hashes a plaintext password with bcrypt for storage.
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, saltRounds);
};

// Compares a plaintext password against a stored bcrypt hash.
export const compareHash = async (password: string, passwordHash: string) => {
  return bcrypt.compare(password, passwordHash);
};

// Encrypts text with AES-256-CTR using a key derived from `key` via SHA-512,
// prefixing the output with the random IV used for that encryption.
export const encryptText = (textToEncrypt: string, key: string): string => {
  const keyHash = createHash('sha512')
    .update(key)
    .digest('hex')
    .substring(0, 32);

  const iv = randomBytes(16);

  const cipher = createCipheriv('aes-256-ctr', keyHash, iv);

  return Buffer.concat([
    iv,
    cipher.update(textToEncrypt),
    cipher.final(),
  ]).toString('base64');
};

// Reverses encryptText: extracts the IV prefix and decrypts the remaining
// ciphertext using the same key-derivation scheme.
export const decryptText = (textToDecrypt: string, key: string): string => {
  const textBuffer = Buffer.from(textToDecrypt, 'base64');
  const iv = textBuffer.subarray(0, 16);
  const text = textBuffer.subarray(16);

  const keyHash = createHash('sha512')
    .update(key)
    .digest('hex')
    .substring(0, 32);

  const decipher = createDecipheriv('aes-256-ctr', keyHash, iv);

  return Buffer.concat([decipher.update(text), decipher.final()]).toString();
};
