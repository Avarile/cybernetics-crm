import { FileFolder } from 'twenty-shared/types';

// Whitelist of file extensions accepted per application file folder, used to
// reject unexpected uploads (e.g. no .exe in a source folder)
export const ALLOWED_EXTENSIONS_BY_APPLICATION_FILE_FOLDER = {
  [FileFolder.BuiltLogicFunction]: { '.mjs': true },
  [FileFolder.BuiltFrontComponent]: { '.mjs': true },
  [FileFolder.Source]: { '.ts': true, '.tsx': true, '.json': true },
  [FileFolder.Dependencies]: { '.json': true, '.lock': true },
} as const satisfies Partial<Record<FileFolder, Record<string, true>>>;
