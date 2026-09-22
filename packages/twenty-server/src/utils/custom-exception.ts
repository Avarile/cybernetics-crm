import { type MessageDescriptor } from '@lingui/core';
import { CustomError } from 'twenty-shared/utils';

const CommonExceptionCode = {
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

// Merges a domain-specific exception code enum with the codes shared by all exceptions.
export const appendCommonExceptionCode = <
  SpecificExceptionCode = Record<string, string>,
>(
  specificExceptionCode: SpecificExceptionCode,
) => {
  return {
    ...CommonExceptionCode,
    ...specificExceptionCode,
  } as const;
};

// Base class for domain exceptions, carrying both a machine-readable code and a
// user-facing translated message alongside the standard Error message.
export abstract class CustomException<
  ExceptionCode extends string = string,
  ExceptionMessage extends string = string,
> extends CustomError {
  code: ExceptionCode;
  userFriendlyMessage: MessageDescriptor;

  constructor(
    message: ExceptionMessage,
    code: ExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage: MessageDescriptor },
  ) {
    super(message);
    this.code = code;
    this.userFriendlyMessage = userFriendlyMessage;
  }
}

/**
 * Exception class for test scenarios and edge cases.
 * Prefer domain-specific exceptions in production code.
 */
export class UnknownException extends CustomException {}
