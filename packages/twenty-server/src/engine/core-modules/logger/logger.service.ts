// App-wide logger facade implementing NestJS's LoggerService interface,
// delegating to the configured driver and adding an opt-in "performance"
// log level with simple named perf timers.
import {
  ConsoleLogger,
  Inject,
  Injectable,
  type LogLevel,
  LoggerService as LoggerServiceInterface,
} from '@nestjs/common';

import { LOGGER_DRIVER } from 'src/engine/core-modules/logger/logger.constants';
import { type TwentyLogLevel } from 'src/engine/core-modules/logger/interfaces';

type LoggerDriverType = ConsoleLogger & {
  options?: {
    logLevels?: LogLevel[];
  };
};

@Injectable()
export class LoggerService implements LoggerServiceInterface {
  private readonly perfTimers = new Map<string, number>();

  constructor(@Inject(LOGGER_DRIVER) private driver: LoggerDriverType) {}

  // Whether the driver's configured log levels include 'performance'.
  private isPerfLoggingEnabled() {
    return (
      (
        this.driver.options?.logLevels as TwentyLogLevel[] | undefined
      )?.includes('performance') ?? false
    );
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  log(message: any, category: string, ...optionalParams: any[]) {
    this.driver.log.apply(this.driver, [message, category, ...optionalParams]);
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  error(message: any, category: string, ...optionalParams: any[]) {
    this.driver.error.apply(this.driver, [
      message,
      category,
      ...optionalParams,
    ]);
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  warn(message: any, category: string, ...optionalParams: any[]) {
    this.driver.warn.apply(this.driver, [message, category, ...optionalParams]);
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  debug?(message: any, category: string, ...optionalParams: any[]) {
    this.driver.debug?.apply(this.driver, [
      message,
      category,
      ...optionalParams,
    ]);
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  verbose?(message: any, category: string, ...optionalParams: any[]) {
    this.driver.verbose?.apply(this.driver, [
      message,
      category,
      ...optionalParams,
    ]);
  }

  setLogLevels(levels: LogLevel[]) {
    this.driver.setLogLevels?.apply(this.driver, [levels]);
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  // Logs a message only when performance logging is enabled.
  perf(message: any, category: string, ...optionalParams: any[]) {
    if (!this.isPerfLoggingEnabled()) {
      return;
    }

    this.driver.log.apply(this.driver, [message, category, ...optionalParams]);
  }

  // Starts a named perf timer, if performance logging is enabled.
  perfTime(category: string, label: string) {
    if (!this.isPerfLoggingEnabled()) {
      return;
    }

    this.perfTimers.set(`${category}::${label}`, performance.now());
  }

  // Stops a named perf timer started with perfTime and logs its duration.
  perfTimeEnd(category: string, label: string) {
    if (!this.isPerfLoggingEnabled()) {
      return;
    }

    const key = `${category}::${label}`;
    const startedAt = this.perfTimers.get(key);

    if (startedAt === undefined) {
      return;
    }

    this.perfTimers.delete(key);

    const durationMs = performance.now() - startedAt;

    this.driver.log.apply(this.driver, [
      `${label}: ${durationMs.toFixed(1)}ms`,
      category,
    ]);
  }
}
