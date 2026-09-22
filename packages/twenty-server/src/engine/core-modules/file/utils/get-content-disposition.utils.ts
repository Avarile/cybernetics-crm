const INLINE_SAFE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'application/pdf',
  'text/plain',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'image/x-icon',
]);

// Returns 'inline' for mime types safe to render in-browser, else 'attachment'.
export const getContentDisposition = (mimeType: string): string => {
  return INLINE_SAFE_MIME_TYPES.has(mimeType) ? 'inline' : 'attachment';
};
