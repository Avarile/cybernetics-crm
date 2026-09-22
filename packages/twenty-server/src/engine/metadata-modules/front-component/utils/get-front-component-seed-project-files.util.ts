import fs from 'fs/promises';
import path from 'path';

import { ASSET_PATH } from 'src/constants/assets-path';

// A single file loaded from a front component seed project template.
export type FrontComponentSeedProjectFile = {
  name: string;
  path: string;
  content: Buffer;
};

// Recursively reads every file under a directory into seed project file
// entries, preserving each file's path relative to the root.
const getAllFiles = async (
  rootDir: string,
  dir: string = rootDir,
  files: FrontComponentSeedProjectFile[] = [],
): Promise<FrontComponentSeedProjectFile[]> => {
  const dirEntries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of dirEntries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await getAllFiles(rootDir, fullPath, files);
    } else {
      files.push({
        path: path.relative(rootDir, dir),
        name: entry.name,
        content: await fs.readFile(fullPath),
      });
    }
  }

  return files;
};

// Loads all files for a named front component seed project template
// (e.g. "hello-world"), used to scaffold a new front component.
export const getFrontComponentSeedProjectFiles = async (
  subdirectory: string,
): Promise<FrontComponentSeedProjectFile[]> => {
  const seedProjectPath = path.join(
    ASSET_PATH,
    'engine/metadata-modules/front-component/constants/seed-project',
    subdirectory,
  );

  return getAllFiles(seedProjectPath);
};
