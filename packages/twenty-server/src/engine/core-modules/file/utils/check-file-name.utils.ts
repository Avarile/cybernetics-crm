import { BadRequestException } from '@nestjs/common';

import { basename } from 'path';

// Validates a filename is safe (no path separators, no null bytes, has an
// extension) and returns its sanitized basename, or throws.
export const checkFilename = (filename: string) => {
  const sanitizedFilename = filename.replace(/\0/g, '');

  if (
    !sanitizedFilename ||
    sanitizedFilename.includes('/') ||
    sanitizedFilename.includes('\\') ||
    !sanitizedFilename.includes('.')
  ) {
    throw new BadRequestException(`Filename '${filename}' is not allowed`);
  }

  return basename(sanitizedFilename);
};
