import { createHash } from 'crypto';

// TODO: migrate to twenty-shared and spread everywhere
// Hashes a logic function file's content into a short, deterministic checksum.
export const logicFunctionCreateHash = (fileContent: string) => {
  return createHash('sha512')
    .update(fileContent)
    .digest('hex')
    .substring(0, 32);
};
