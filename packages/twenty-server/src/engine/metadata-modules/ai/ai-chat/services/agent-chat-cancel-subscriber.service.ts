import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';

import type { Redis } from 'ioredis';

import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';

// Single shared Redis subscriber connection per process for AI stream
// cancellation. Multiplexes all cancel channels onto one connection
// so we use exactly 1 Redis connection regardless of how many
// concurrent streams are running.
@Injectable()
export class AgentChatCancelSubscriberService implements OnModuleDestroy {
  private readonly logger = new Logger(AgentChatCancelSubscriberService.name);
  private subscriber: Redis | null = null;
  private readonly callbacks = new Map<string, () => void>();

  constructor(private readonly redisClientService: RedisClientService) {}

  // Lazily creates the shared subscriber connection and dispatches incoming
  // cancel messages to the registered callback, unsubscribing once fired.
  private ensureSubscriber(): Redis {
    if (!this.subscriber) {
      this.subscriber = this.redisClientService.getClient().duplicate();
      this.subscriber.on('message', (channel: string) => {
        const callback = this.callbacks.get(channel);

        if (callback) {
          callback();
          this.callbacks.delete(channel);
          this.subscriber?.unsubscribe(channel).catch(() => {});
        }
      });
    }

    return this.subscriber;
  }

  // Registers a callback to run when the given cancel channel fires.
  async subscribe(channel: string, onCancel: () => void): Promise<void> {
    this.callbacks.set(channel, onCancel);
    await this.ensureSubscriber().subscribe(channel);
  }

  // Removes a channel's callback and unsubscribes from it, e.g. once a
  // stream completes without being cancelled.
  async unsubscribe(channel: string): Promise<void> {
    this.callbacks.delete(channel);
    await this.subscriber?.unsubscribe(channel).catch(() => {});
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit().catch(() => {});
      this.subscriber = null;
    }

    this.callbacks.clear();
  }
}
