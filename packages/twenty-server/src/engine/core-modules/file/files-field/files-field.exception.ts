// Exception type for errors managing FILES-type field attachments.
import { type MessageDescriptor } from '@lingui/core';

import { CustomException } from 'src/utils/custom-exception';

export enum FilesFieldExceptionCode {
  FILE_DELETION_FAILED = 'FILE_DELETION_FAILED',
  BAD_REQUEST = 'BAD_REQUEST',
  TEMPORARY_FILE_NOT_ALLOWED = 'TEMPORARY_FILE_NOT_ALLOWED',
}

// Exception thrown by files-field services; requires an explicit friendly message.
export class FilesFieldException extends CustomException<FilesFieldExceptionCode> {
  constructor(
    message: string,
    code: FilesFieldExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage: MessageDescriptor },
  ) {
    super(message, code, {
      userFriendlyMessage,
    });
  }
}
