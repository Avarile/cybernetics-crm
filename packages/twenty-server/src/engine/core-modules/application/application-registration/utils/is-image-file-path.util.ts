// Image extensions eligible for rehosting as an application/registration
// asset.
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.avif',
]);

// True when a file path's extension is an allowed image type.
export const isImageFilePath = (filePath: string): boolean => {
  const lastDotIndex = filePath.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return false;
  }

  return ALLOWED_IMAGE_EXTENSIONS.has(
    filePath.slice(lastDotIndex).toLowerCase(),
  );
};
