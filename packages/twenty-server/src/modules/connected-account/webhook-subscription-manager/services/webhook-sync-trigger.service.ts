import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  CalendarChannelSyncStage,
  MessageChannelSyncStage,
} from 'twenty-shared/types';
import { Repository } from 'typeorm';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import {
  CalendarEventListFetchJob,
  type CalendarEventListFetchJobData,
} from 'src/modules/calendar/calendar-event-import-manager/jobs/calendar-event-list-fetch.job';
import {
  MessagingMessageListFetchJob,
  type MessagingMessageListFetchJobData,
} from 'src/modules/messaging/message-import-manager/jobs/messaging-message-list-fetch.job';

// Kicks off an immediate sync in response to a provider webhook
// notification, atomically claiming the channel (only if still pending) so
// concurrent notifications don't double-schedule a fetch.
@Injectable()
export class WebhookSyncTriggerService {
  constructor(
    @InjectMessageQueue(MessageQueue.messagingQueue)
    private readonly messagingQueueService: MessageQueueService,
    @InjectMessageQueue(MessageQueue.calendarQueue)
    private readonly calendarQueueService: MessageQueueService,
    @InjectRepository(MessageChannelEntity)
    private readonly messageChannelRepository: Repository<MessageChannelEntity>,
    @InjectRepository(CalendarChannelEntity)
    private readonly calendarChannelRepository: Repository<CalendarChannelEntity>,
  ) {}

  // Claims a pending message channel and queues its message list fetch;
  // reverts the claim if enqueuing fails.
  async triggerMessagingSync(
    messageChannelId: string,
    workspaceId: string,
  ): Promise<void> {
    const updateResult = await this.messageChannelRepository
      .createQueryBuilder()
      .update()
      .set({
        syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_SCHEDULED,
        syncStageStartedAt: new Date(),
      })
      .where({
        id: messageChannelId,
        workspaceId,
        isSyncEnabled: true,
        syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING,
      })
      .returning('id')
      .execute();

    if (updateResult.raw.length === 0) {
      return;
    }

    try {
      await this.messagingQueueService.add<MessagingMessageListFetchJobData>(
        MessagingMessageListFetchJob.name,
        { workspaceId, messageChannelId },
      );
    } catch (error) {
      await this.messageChannelRepository
        .createQueryBuilder()
        .update()
        .set({
          syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING,
        })
        .where({
          id: messageChannelId,
          workspaceId,
        })
        .execute();

      throw error;
    }
  }

  // Claims a pending calendar channel and queues its event list fetch;
  // reverts the claim if enqueuing fails.
  async triggerCalendarSync(
    calendarChannelId: string,
    workspaceId: string,
  ): Promise<void> {
    const updateResult = await this.calendarChannelRepository
      .createQueryBuilder()
      .update()
      .set({
        syncStage: CalendarChannelSyncStage.CALENDAR_EVENT_LIST_FETCH_SCHEDULED,
        syncStageStartedAt: new Date(),
      })
      .where({
        id: calendarChannelId,
        workspaceId,
        isSyncEnabled: true,
        syncStage: CalendarChannelSyncStage.CALENDAR_EVENT_LIST_FETCH_PENDING,
      })
      .returning('id')
      .execute();

    if (updateResult.raw.length === 0) {
      return;
    }

    try {
      await this.calendarQueueService.add<CalendarEventListFetchJobData>(
        CalendarEventListFetchJob.name,
        { workspaceId, calendarChannelId },
      );
    } catch (error) {
      await this.calendarChannelRepository
        .createQueryBuilder()
        .update()
        .set({
          syncStage: CalendarChannelSyncStage.CALENDAR_EVENT_LIST_FETCH_PENDING,
        })
        .where({
          id: calendarChannelId,
          workspaceId,
        })
        .execute();

      throw error;
    }
  }
}
