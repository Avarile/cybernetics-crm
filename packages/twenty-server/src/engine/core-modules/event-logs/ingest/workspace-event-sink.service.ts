// Fans out event envelopes to all configured sinks and publishes them to
// live subscribers.
import { Inject, Injectable } from '@nestjs/common';

import {
  EVENT_SINKS,
  type EventSink,
} from 'src/engine/core-modules/event-logs/ingest/event-sink';
import { EventLogLiveService } from 'src/engine/core-modules/event-logs/live/event-log-live.service';
import { type WorkspaceEventEnvelope } from 'src/engine/core-modules/event-logs/types/workspace-event-envelope.type';

@Injectable()
export class WorkspaceEventSinkService {
  constructor(
    @Inject(EVENT_SINKS)
    private readonly sinks: EventSink[],
    private readonly workspaceEventLiveService: EventLogLiveService,
  ) {}

  // Whether at least one event sink is configured.
  isEnabled(): boolean {
    return this.sinks.length > 0;
  }

  // Persists events to all sinks and publishes them to live watchers.
  async ingest(events: WorkspaceEventEnvelope[]): Promise<void> {
    await this.persist(events);
    await this.workspaceEventLiveService.publishWatched(events);
  }

  // Writes events to every configured sink in parallel.
  private async persist(events: WorkspaceEventEnvelope[]): Promise<void> {
    await Promise.all(this.sinks.map((sink) => sink.write(events)));
  }
}
