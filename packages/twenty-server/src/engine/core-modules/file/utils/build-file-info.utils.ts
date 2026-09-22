import { v4 as uuidV4 } from 'uuid';

// Generates a UUID-based storage filename preserving the original extension.
export const buildFileInfo = (filename: string) => {
  const parts = filename.split('.');

  const ext = parts.length > 1 ? parts.pop() || '' : '';

  const name = `${uuidV4()}${ext ? `.${ext}` : ''}`;

  return { ext, name };
};
