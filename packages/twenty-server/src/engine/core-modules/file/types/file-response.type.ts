// Result of resolving a stored file for serving: either redirect to a
// presigned URL, or stream the bytes directly.
import { type Readable } from 'stream';

export type FileResponse =
  | { type: 'redirect'; presignedUrl: string }
  | { type: 'stream'; stream: Readable; mimeType: string };
