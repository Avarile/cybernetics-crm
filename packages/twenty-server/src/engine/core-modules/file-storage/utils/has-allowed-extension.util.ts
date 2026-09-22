import { extname } from 'path';

// Whether the file's extension (case-insensitive) is in the allowed set
export const hasAllowedExtension = ({
  filePath,
  allowedExtensions,
}: {
  filePath: string;
  allowedExtensions: Readonly<Record<string, true>>;
}): boolean => {
  const ext = extname(filePath).toLowerCase();

  return allowedExtensions[ext] === true;
};
