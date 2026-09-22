import { type ExtendedUIMessage } from 'twenty-shared/ai';

import { type ExtractedFile } from 'src/engine/metadata-modules/ai/ai-chat/types/extracted-file.type';

// Result of pulling file attachments out of chat messages for the code
// interpreter: the messages with those parts removed/replaced, plus the extracted files.
export type ExtractCodeInterpreterFilesResult = {
  processedMessages: ExtendedUIMessage[];
  extractedFiles: ExtractedFile[];
};
