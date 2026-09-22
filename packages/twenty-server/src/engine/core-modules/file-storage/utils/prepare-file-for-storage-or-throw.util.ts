import { extractFileInfoOrThrow } from 'src/engine/core-modules/file/utils/extract-file-info-or-throw.utils';
import { sanitizeFile } from 'src/engine/core-modules/file/utils/sanitize-file.utils';

// Detects the file's real mime type/extension from its content and sanitizes it
// before it's written to storage
export const prepareFileForStorageOrThrow = async ({
  sourceFile,
  resourcePath,
}: {
  sourceFile: Buffer | Uint8Array | string;
  resourcePath: string;
}): Promise<{
  sourceFile: Buffer | Uint8Array | string;
  mimeType: string;
}> => {
  const bufferForExtract =
    typeof sourceFile === 'string'
      ? Buffer.from(sourceFile, 'utf8')
      : Buffer.isBuffer(sourceFile)
        ? sourceFile
        : Buffer.from(sourceFile);

  const { mimeType, ext } = await extractFileInfoOrThrow({
    file: bufferForExtract,
    filename: resourcePath,
  });

  const sanitizedSourceFile = sanitizeFile({
    file: sourceFile,
    ext,
    mimeType,
  });

  return { sourceFile: sanitizedSourceFile, mimeType };
};
