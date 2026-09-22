// Custom exception type and error codes for application variable failures,
// with user-friendly translated messages per code.
import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

export enum ApplicationVariableEntityExceptionCode {
  APPLICATION_VARIABLE_NOT_FOUND = 'APPLICATION_VARIABLE_NOT_FOUND',
  INVALID_APPLICATION_VARIABLE_INPUT = 'INVALID_APPLICATION_VARIABLE_INPUT',
}

// Returns the localized, user-facing message for a given exception code.
const getApplicationVariableEntityExceptionUserFriendlyMessage = (
  code: ApplicationVariableEntityExceptionCode,
) => {
  switch (code) {
    case ApplicationVariableEntityExceptionCode.APPLICATION_VARIABLE_NOT_FOUND:
      return msg`Application variable not found.`;
    case ApplicationVariableEntityExceptionCode.INVALID_APPLICATION_VARIABLE_INPUT:
      return msg`Invalid application variable input.`;
    default:
      assertUnreachable(code);
  }
};

// Exception thrown for application variable failures (not found, invalid
// input).
export class ApplicationVariableEntityException extends CustomException<ApplicationVariableEntityExceptionCode> {
  constructor(
    message: string,
    code: ApplicationVariableEntityExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ??
        getApplicationVariableEntityExceptionUserFriendlyMessage(code),
    });
  }
}
