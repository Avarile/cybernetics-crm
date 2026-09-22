import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

// Error codes for invalid message-folder operations (missing folder, bad input, ownership checks).
export enum MessageFolderExceptionCode {
  MESSAGE_FOLDER_NOT_FOUND = 'MESSAGE_FOLDER_NOT_FOUND',
  INVALID_MESSAGE_FOLDER_INPUT = 'INVALID_MESSAGE_FOLDER_INPUT',
  MESSAGE_FOLDER_OWNERSHIP_VIOLATION = 'MESSAGE_FOLDER_OWNERSHIP_VIOLATION',
}

// Maps an exception code to the message shown to the end user.
const getMessageFolderExceptionUserFriendlyMessage = (
  code: MessageFolderExceptionCode,
) => {
  switch (code) {
    case MessageFolderExceptionCode.MESSAGE_FOLDER_NOT_FOUND:
      return msg`Message folder not found.`;
    case MessageFolderExceptionCode.INVALID_MESSAGE_FOLDER_INPUT:
      return msg`Invalid message folder input.`;
    case MessageFolderExceptionCode.MESSAGE_FOLDER_OWNERSHIP_VIOLATION:
      return msg`You do not have access to this message folder.`;
    default:
      assertUnreachable(code);
  }
};

// Domain exception for message-folder failures, carrying a user-friendly message by default.
export class MessageFolderException extends CustomException<MessageFolderExceptionCode> {
  constructor(
    message: string,
    code: MessageFolderExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ??
        getMessageFolderExceptionUserFriendlyMessage(code),
    });
  }
}
