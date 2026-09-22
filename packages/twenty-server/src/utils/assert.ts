import { type HttpException } from '@nestjs/common';

type Assert = (
  condition: unknown,
  message?: string,
  ErrorType?: new (message?: string) => HttpException,
) => asserts condition;

/**
 * assert condition and throws a HttpException
 */
export const assert: Assert = (condition, message, ErrorType) => {
  if (!condition) {
    if (ErrorType) {
      if (message) {
        throw new ErrorType(message);
      }

      throw new ErrorType();
    }

    throw new Error(message);
  }
};

// Exhaustiveness check: fails type checking if called with a value that isn't `never`,
// so switch/if-else chains that should cover every case surface unhandled branches.
export const assertNever = (_value: never, message?: string): never => {
  throw new Error(message ?? "Didn't expect to get here.");
};
