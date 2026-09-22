import { promises as fs } from 'fs';

// Checks whether a filesystem path exists and is accessible.
export const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);

    return true;
  } catch {
    return false;
  }
};
