import { type DynamicModule, Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { MessageQueueCoreModule } from 'src/engine/core-modules/message-queue/message-queue-core.module';
import { MessageQueueMetadataAccessor } from 'src/engine/core-modules/message-queue/message-queue-metadata.accessor';
import { MessageQueueExplorer } from 'src/engine/core-modules/message-queue/message-queue.explorer';
import {
  type ASYNC_OPTIONS_TYPE,
  type OPTIONS_TYPE,
} from 'src/engine/core-modules/message-queue/message-queue.module-definition';

// Registers the message queue driver/services, and separately the explorer that
// discovers and wires up @Processor classes (kept optional so it registers once)
@Global()
@Module({})
export class MessageQueueModule {
  // Registers the module synchronously with static driver options
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    return {
      module: MessageQueueModule,
      imports: [MessageQueueCoreModule.register(options)],
    };
  }

  // Registers the processor discovery explorer, separate from the driver setup
  static registerExplorer(): DynamicModule {
    return {
      module: MessageQueueModule,
      imports: [DiscoveryModule],
      providers: [MessageQueueExplorer, MessageQueueMetadataAccessor],
    };
  }

  // Registers the module with driver options resolved asynchronously
  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return {
      module: MessageQueueModule,
      imports: [MessageQueueCoreModule.registerAsync(options)],
    };
  }
}
