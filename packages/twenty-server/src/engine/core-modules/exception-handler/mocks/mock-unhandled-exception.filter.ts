import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

// Test-only exception filter that rethrows instead of formatting a response, so
// tests see the real error rather than a swallowed HTTP response
@Catch()
export class MockedUnhandledExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  // oxlint-disable-next-line typescript/no-explicit-any
  catch(exception: any, _host: ArgumentsHost) {
    throw exception;
  }
}
