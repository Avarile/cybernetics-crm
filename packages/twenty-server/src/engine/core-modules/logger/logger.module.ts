// Global module that provisions LoggerService with a concrete logger driver
// (currently only a NestJS ConsoleLogger), built synchronously via forRoot
// or asynchronously (e.g. from config) via forRootAsync.
import {
  ConsoleLogger,
  type DynamicModule,
  Global,
  type LogLevel,
  Module,
} from '@nestjs/common';

import { LoggerDriverType } from 'src/engine/core-modules/logger/interfaces';
import { LOGGER_DRIVER } from 'src/engine/core-modules/logger/logger.constants';
import {
  type ASYNC_OPTIONS_TYPE,
  ConfigurableModuleClass,
  type OPTIONS_TYPE,
} from 'src/engine/core-modules/logger/logger.module-definition';
import { LoggerService } from 'src/engine/core-modules/logger/logger.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule extends ConfigurableModuleClass {
  // Builds the module with a synchronously-provided logger driver.
  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    const provider = {
      provide: LOGGER_DRIVER,
      useValue:
        options.type === LoggerDriverType.CONSOLE
          ? new ConsoleLogger()
          : undefined,
    };
    const dynamicModule = super.forRoot(options);

    return {
      ...dynamicModule,
      providers: [...(dynamicModule.providers ?? []), provider],
    };
  }

  // Builds the module with an asynchronously-resolved logger driver
  // (e.g. depending on injected config), applying its configured log levels.
  static forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const provider = {
      provide: LOGGER_DRIVER,
      // oxlint-disable-next-line typescript/no-explicit-any
      useFactory: async (...args: any[]) => {
        const config = await options?.useFactory?.(...args);

        if (!config) {
          return null;
        }

        const logLevels = config.logLevels ?? [];

        const logger =
          config?.type === LoggerDriverType.CONSOLE
            ? new ConsoleLogger()
            : undefined;

        logger?.setLogLevels(logLevels as LogLevel[]);

        return logger;
      },
      inject: options.inject || [],
    };
    const dynamicModule = super.forRootAsync(options);

    return {
      ...dynamicModule,
      providers: [...(dynamicModule.providers ?? []), provider],
    };
  }
}
