/* oxlint-disable no-console */
// Temporarily replaces global console methods to capture log output during a
// local function execution, restoring the originals on release.
export class ConsoleListener {
  private readonly originalConsole;

  constructor() {
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  // Replaces console methods with a callback capturing their type/args.
  intercept(callback: (type: string, message: any[]) => void) {
    Object.keys(this.originalConsole).forEach((method) => {
      // @ts-expect-error legacy noImplicitAny
      // oxlint-disable-next-line typescript/no-explicit-any
      console[method] = (...args: any[]) => {
        callback(method, args);
      };
    });
  }

  // Restores the original console methods.
  release() {
    Object.keys(this.originalConsole).forEach((method) => {
      // @ts-expect-error legacy noImplicitAny
      // oxlint-disable-next-line typescript/no-explicit-any
      console[method] = (...args: any[]) => {
        // @ts-expect-error legacy noImplicitAny
        this.originalConsole[method](...args);
      };
    });
  }
}
