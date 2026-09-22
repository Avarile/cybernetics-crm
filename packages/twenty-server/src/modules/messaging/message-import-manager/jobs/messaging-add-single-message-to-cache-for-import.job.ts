// Adds a single message's external id to the cache set of messages
// pending import for a message channel, so the regular import job will
// pick it up (used by the single-message-import CLI command).
import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

export type MessagingAddSingleMessageToCacheForImportJobData = {
  messageExternalId: string;
  messageChannelId: string;
  workspaceId: string;
};

@Processor(MessageQueue.messagingQueue)
export class MessagingAddSingleMessageToCacheForImportJob {
  constructor(
    @InjectCacheStorage(CacheStorageNamespace.ModuleMessaging)
    private readonly cacheStorage: CacheStorageService,
  ) {}

  // Adds the message's external id to the channel's pending-import cache set.
  @Process(MessagingAddSingleMessageToCacheForImportJob.name)
  async handle(
    data: MessagingAddSingleMessageToCacheForImportJobData,
  ): Promise<void> {
    const { messageExternalId, messageChannelId, workspaceId } = data;

    await this.cacheStorage.setAdd(
      `messages-to-import:${workspaceId}:${messageChannelId}`,
      [messageExternalId],
    );
  }
}
