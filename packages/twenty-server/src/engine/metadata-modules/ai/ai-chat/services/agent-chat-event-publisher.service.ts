// Publishes chat stream events to subscribers over the subscription service,
// buffering stream chunks in Redis so a reconnecting client can catch up.
import { Injectable } from '@nestjs/common';

import { type AgentChatSubscriptionEvent } from 'twenty-shared/ai';

import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import { SubscriptionService } from 'src/engine/subscriptions/subscription.service';

const STREAM_CHUNKS_TTL_SECONDS = 3600;

@Injectable()
export class AgentChatEventPublisherService {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly redisClientService: RedisClientService,
  ) {}

  private getStreamChunksKey(threadId: string): string {
    return `agent-chat-stream-chunks:${threadId}`;
  }

  // Publishes an event to the thread's subscribers; stream chunks are also
  // appended to a Redis buffer (with a sequence number) for catch-up, and
  // that buffer is cleared once the message is finalized or credits run out.
  async publish({
    threadId,
    workspaceId,
    event,
  }: {
    threadId: string;
    workspaceId: string;
    event: AgentChatSubscriptionEvent;
  }): Promise<void> {
    let publishedEvent = event;

    if (event.type === 'stream-chunk') {
      const redis = this.redisClientService.getClient();
      const key = this.getStreamChunksKey(threadId);

      // RPUSH returns the new list length — use it as a 1-based sequence number
      const seq = await redis.rpush(key, JSON.stringify(event.chunk));
      await redis.expire(key, STREAM_CHUNKS_TTL_SECONDS);

      publishedEvent = { ...event, seq };
    } else if (
      event.type === 'message-persisted' ||
      event.type === 'credits-exhausted'
    ) {
      const redis = this.redisClientService.getClient();
      await redis.del(this.getStreamChunksKey(threadId));
    }

    await this.subscriptionService.publishToAgentChat({
      workspaceId,
      threadId,
      payload: {
        onAgentChatEvent: {
          threadId,
          event: publishedEvent,
        },
      },
    });
  }

  // Clears any buffered stream chunks for the thread, e.g. before starting a new stream.
  async resetStreamState(threadId: string): Promise<void> {
    const redis = this.redisClientService.getClient();

    await redis.del(this.getStreamChunksKey(threadId));
  }

  // Reads all buffered stream chunks for a thread, for stream catch-up.
  async getAccumulatedChunks(threadId: string): Promise<{
    chunks: Record<string, unknown>[];
    maxSeq: number;
  }> {
    const redis = this.redisClientService.getClient();
    const rawChunks = await redis.lrange(
      this.getStreamChunksKey(threadId),
      0,
      -1,
    );

    return {
      chunks: rawChunks.map((raw) => JSON.parse(raw)),
      maxSeq: rawChunks.length,
    };
  }
}
