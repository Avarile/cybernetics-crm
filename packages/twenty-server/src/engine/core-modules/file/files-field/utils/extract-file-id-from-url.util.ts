import { type FileFolder } from 'twenty-shared/types';
import { isDefined, isValidUuid } from 'twenty-shared/utils';

// Extracts the file id from an internal file URL for a given folder,
// returning null for external links or non-UUID/malformed ids.
export const extractFileIdFromUrl = (
  url: string,
  fileFolder: FileFolder,
): string | null => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const pathname = parsedUrl.pathname;
  const isLinkExternal = !pathname.startsWith(`/file/${fileFolder}/`);

  if (isLinkExternal) {
    return null;
  }

  const fileId = pathname.match(`/${fileFolder}/([^/]+)`)?.[1];

  return isDefined(fileId) && isValidUuid(fileId) ? fileId : null;
};
