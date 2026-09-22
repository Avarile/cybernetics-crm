import { type ExceptionHandlerOptions } from 'src/engine/core-modules/exception-handler/interfaces/exception-handler-options.interface';

// Contract implemented by each exception handler backend (console, Sentry)
export interface ExceptionHandlerDriverInterface {
  captureExceptions(
    // oxlint-disable-next-line typescript/no-explicit-any
    exceptions: ReadonlyArray<any>,
    options?: ExceptionHandlerOptions,
  ): string[];
}
