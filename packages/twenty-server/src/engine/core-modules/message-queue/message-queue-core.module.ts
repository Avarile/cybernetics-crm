import {
  type DynamicModule,
  Global,
  Logger,
  Module,
  type Provider,
} from '@nestjs/common';

import { type MessageQueueDriver } from 'src/engine/core-modules/message-queue/drivers/interfaces/message-queue-driver.interface';

import { BullMQDriver } from 'src/engine/core-modules/message-queue/drivers/bullmq.driver';
import { SyncDriver } from 'src/engine/core-modules/message-queue/drivers/sync.driver';
import { MessageQueueDriverType } from 'src/engine/core-modules/message-queue/interfaces';
import {
  MessageQueue,
  QUEUE_DRIVER,
} from 'src/engine/core-modules/message-queue/message-queue.constants';
import {
  type ASYNC_OPTIONS_TYPE,
  ConfigurableModuleClass,
  type OPTIONS_TYPE,
} from 'src/engine/core-modules/message-queue/message-queue.module-definition';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { getQueueToken } from 'src/engine/core-modules/message-queue/utils/get-queue-token.util';
import { MetricsModule } from 'src/engine/core-modules/metrics/metrics.module';

// Registers the message queue driver and a per-MessageQueue service provider globally
@Global()
@Module({})
export class MessageQueueCoreModule extends ConfigurableModuleClass {
  private static readonly logger = new Logger(MessageQueueCoreModule.name);

  // Builds the module synchronously with a driver created from static options
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    const dynamicModule = super.register(options);

    const driverProvider: Provider = {
      provide: QUEUE_DRIVER,
      useFactory: () => {
        return this.createDriver(options);
      },
    };

    const queueProviders = this.createQueueProviders();

    return {
      ...dynamicModule,
      providers: [
        ...(dynamicModule.providers ?? []),
        driverProvider,
        ...queueProviders,
      ],
      exports: [
        ...(dynamicModule.exports ?? []),
        ...Object.values(MessageQueue).map((queueName) =>
          getQueueToken(queueName),
        ),
      ],
    };
  }

  // Builds the module with a driver resolved asynchronously via the given factory
  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const dynamicModule = super.registerAsync(options);

    const driverProvider: Provider = {
      provide: QUEUE_DRIVER,
      // oxlint-disable-next-line typescript/no-explicit-any
      useFactory: async (...args: any[]) => {
        if (options.useFactory) {
          const config = await options.useFactory(...args);

          return this.createDriver(config);
        }
        throw new Error('useFactory is not defined');
      },
      inject: options.inject || [],
    };

    const queueProviders = MessageQueueCoreModule.createQueueProviders();

    return {
      ...dynamicModule,
      imports: [...(dynamicModule.imports ?? []), MetricsModule],
      providers: [
        ...(dynamicModule.providers ?? []),
        driverProvider,
        ...queueProviders,
      ],
      exports: [
        ...(dynamicModule.exports ?? []),
        ...Object.values(MessageQueue).map((queueName) =>
          getQueueToken(queueName),
        ),
      ],
    };
  }

  // Instantiates the driver matching the configured type, falling back to the
  // sync driver (with a warning) for an unrecognized type
  static async createDriver(config: typeof OPTIONS_TYPE) {
    switch (config.type) {
      case MessageQueueDriverType.BullMQ: {
        return new BullMQDriver(
          config.options,
          config.metricsService,
          config.twentyConfigService,
        );
      }
      case MessageQueueDriverType.Sync: {
        return new SyncDriver();
      }
      default: {
        this.logger.warn(
          `Unsupported message queue driver type: ${(config as { type: string })?.type}. Using SyncDriver by default.`,
        );

        return new SyncDriver();
      }
    }
  }

  // Creates one MessageQueueService provider per MessageQueue, all sharing the
  // single configured driver instance
  static createQueueProviders(): Provider[] {
    return Object.values(MessageQueue).map((queueName) => ({
      provide: getQueueToken(queueName),
      useFactory: (driver: MessageQueueDriver) => {
        return new MessageQueueService(driver, queueName);
      },
      inject: [QUEUE_DRIVER],
    }));
  }
}
