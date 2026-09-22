// Listens for batched database mutation events (create/update/delete/
// restore/destroy) emitted after CRUD resolvers run, and fans each batch
// out to: the record-event publisher (for subscriptions), the webhook
// queue, the database-event-trigger queue, and — for audit-logged
// objects — the event-log/timeline-activity queues. Timeline activity
// events themselves are only published, not fanned out further.
import { Injectable } from '@nestjs/common';

import {
  type ObjectRecordCreateEvent,
  type ObjectRecordDeleteEvent,
  type ObjectRecordDestroyEvent,
  type ObjectRecordEvent,
  type ObjectRecordNonDestructiveEvent,
  type ObjectRecordRestoreEvent,
  type ObjectRecordUpdateEvent,
} from 'twenty-shared/database-events';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { CreateEventLogFromInternalEvent } from 'src/engine/core-modules/event-logs/ingest/create-event-log-from-internal-event';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { CallWebhookJobsJob } from 'src/engine/metadata-modules/webhook/jobs/call-webhook-jobs.job';
import { WorkspaceEventBatchForWebhook } from 'src/engine/metadata-modules/webhook/types/workspace-event-batch-for-webhook.type';
import { CallDatabaseEventTriggerJobsJob } from 'src/engine/core-modules/logic-function/logic-function-trigger/triggers/database-event/call-database-event-trigger-jobs.job';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { ObjectRecordEventPublisher } from 'src/engine/subscriptions/object-record-event/object-record-event-publisher';
import { UpsertTimelineActivityFromInternalEvent } from 'src/modules/timeline/jobs/upsert-timeline-activity-from-internal-event.job';

@Injectable()
export class EntityEventsToDbListener {
  constructor(
    @InjectMessageQueue(MessageQueue.entityEventsToDbQueue)
    private readonly entityEventsToDbQueueService: MessageQueueService,
    @InjectMessageQueue(MessageQueue.webhookQueue)
    private readonly webhookQueueService: MessageQueueService,
    @InjectMessageQueue(MessageQueue.triggerQueue)
    private readonly triggerQueueService: MessageQueueService,
    private readonly objectRecordEventPublisher: ObjectRecordEventPublisher,
  ) {}

  // Handles a batch of record-created events across all objects.
  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreate(batchEvent: WorkspaceEventBatch<ObjectRecordCreateEvent>) {
    return this.handleEvent(batchEvent, DatabaseEventAction.CREATED);
  }

  // Handles a batch of record-updated events across all objects.
  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdate(batchEvent: WorkspaceEventBatch<ObjectRecordUpdateEvent>) {
    return this.handleEvent(batchEvent, DatabaseEventAction.UPDATED);
  }

  // Handles a batch of record-deleted (soft-delete) events across all objects.
  @OnDatabaseBatchEvent('*', DatabaseEventAction.DELETED)
  async handleDelete(batchEvent: WorkspaceEventBatch<ObjectRecordDeleteEvent>) {
    return this.handleEvent(batchEvent, DatabaseEventAction.DELETED);
  }

  // Handles a batch of record-restored events across all objects.
  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestore(
    batchEvent: WorkspaceEventBatch<ObjectRecordRestoreEvent>,
  ) {
    return this.handleEvent(batchEvent, DatabaseEventAction.RESTORED);
  }

  // Handles a batch of record-destroyed (hard-delete) events across all objects.
  @OnDatabaseBatchEvent('*', DatabaseEventAction.DESTROYED)
  async handleDestroy(
    batchEvent: WorkspaceEventBatch<ObjectRecordDestroyEvent>,
  ) {
    return this.handleEvent(batchEvent, DatabaseEventAction.DESTROYED);
  }

  // Timeline-activity events are only published (they represent
  // internal activity, not user data changes); everything else is
  // published and fanned out to webhook and trigger queues, plus
  // audit-log/timeline-activity ingestion queues when the object is
  // audit-logged and the action isn't a hard delete.
  private async handleEvent<T extends ObjectRecordEvent>(
    batchEvent: WorkspaceEventBatch<T>,
    action: DatabaseEventAction,
  ) {
    if (
      batchEvent.objectMetadata.universalIdentifier ===
      STANDARD_OBJECTS.timelineActivity.universalIdentifier
    ) {
      await this.objectRecordEventPublisher.publish(batchEvent);

      return;
    }

    const isAuditLogBatchEvent = batchEvent.objectMetadata?.isAuditLogged;

    const batchEventForWebhook = {
      ...batchEvent,
      objectMetadata: {
        id: batchEvent.objectMetadata.id,
        nameSingular: batchEvent.objectMetadata.nameSingular,
      },
    };

    const promises = [
      this.objectRecordEventPublisher.publish(batchEvent),
      this.webhookQueueService.add<WorkspaceEventBatchForWebhook<T>>(
        CallWebhookJobsJob.name,
        batchEventForWebhook,
        {
          retryLimit: 3,
        },
      ),
    ];

    promises.push(
      this.triggerQueueService.add<WorkspaceEventBatch<T>>(
        CallDatabaseEventTriggerJobsJob.name,
        batchEvent,
        { retryLimit: 3 },
      ),
    );

    if (isAuditLogBatchEvent && action !== DatabaseEventAction.DESTROYED) {
      promises.push(
        this.entityEventsToDbQueueService.add<WorkspaceEventBatch<T>>(
          CreateEventLogFromInternalEvent.name,
          batchEvent,
        ),
      );

      promises.push(
        this.entityEventsToDbQueueService.add<
          WorkspaceEventBatch<ObjectRecordNonDestructiveEvent>
        >(
          UpsertTimelineActivityFromInternalEvent.name,
          batchEvent as WorkspaceEventBatch<ObjectRecordNonDestructiveEvent>,
        ),
      );
    }

    await Promise.all(promises);
  }
}
