import { Inject, Injectable } from '@nestjs/common';

import { type ExceptionHandlerOptions } from 'src/engine/core-modules/exception-handler/interfaces/exception-handler-options.interface';

import { ExceptionHandlerDriverInterface } from 'src/engine/core-modules/exception-handler/interfaces';
import { EXCEPTION_HANDLER_DRIVER } from 'src/engine/core-modules/exception-handler/exception-handler.constants';

// Thin facade delegating exception capture to the configured driver (console/Sentry)
@Injectable()
export class ExceptionHandlerService {
  constructor(
    @Inject(EXCEPTION_HANDLER_DRIVER)
    private driver: ExceptionHandlerDriverInterface,
  ) {}

  // Forwards exceptions and context to the active driver, returning driver event ids
  captureExceptions(
    // oxlint-disable-next-line typescript/no-explicit-any
    exceptions: ReadonlyArray<any>,
    options?: ExceptionHandlerOptions,
  ): string[] {
    return this.driver.captureExceptions(exceptions, options);
  }
}
