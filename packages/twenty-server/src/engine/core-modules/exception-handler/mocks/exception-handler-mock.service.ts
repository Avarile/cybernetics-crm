import { Injectable } from '@nestjs/common';

import { type ExceptionHandlerOptions } from 'src/engine/core-modules/exception-handler/interfaces/exception-handler-options.interface';

import { type ExceptionHandlerDriverInterface } from 'src/engine/core-modules/exception-handler/interfaces';

// Test double for the exception handler driver: records nothing, just returns fake event ids
@Injectable()
export class ExceptionHandlerMockService implements ExceptionHandlerDriverInterface {
  captureExceptions(
    // oxlint-disable-next-line typescript/no-explicit-any
    exceptions: readonly any[],
    _?: ExceptionHandlerOptions | undefined,
  ): string[] {
    return exceptions.map(() => 'mocked-exception-id');
  }
}
