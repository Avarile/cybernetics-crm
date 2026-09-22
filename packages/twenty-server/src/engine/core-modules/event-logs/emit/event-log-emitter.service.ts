// Entry point for emitting workspace/object/pageview events into the
// ingestion sink, with a per-context helper API and error swallowing so a
// failed emit never breaks the caller's business logic.
import { Injectable, Logger } from '@nestjs/common';

import {
  buildObjectEventEnvelope,
  buildPageviewEnvelope,
  buildWorkspaceEventEnvelope,
  computeEventContextFields,
} from 'src/engine/core-modules/event-logs/emit/build-event-envelope';
import { type PageviewProperties } from 'src/engine/core-modules/event-logs/emit/events/pageview/pageview';
import {
  type TrackEventName,
  type TrackEventProperties,
} from 'src/engine/core-modules/event-logs/emit/events.type';
import { WorkspaceEventSinkService } from 'src/engine/core-modules/event-logs/ingest/workspace-event-sink.service';
import {
  type EventContextFields,
  type WorkspaceEventEnvelope,
} from 'src/engine/core-modules/event-logs/types/workspace-event-envelope.type';

@Injectable()
export class EventLogEmitterService {
  private readonly logger = new Logger(EventLogEmitterService.name);

  constructor(
    private readonly workspaceEventSinkService: WorkspaceEventSinkService,
  ) {}

  // Whether event ingestion is enabled (i.e. a sink is configured).
  isEnabled(): boolean {
    return this.workspaceEventSinkService.isEnabled();
  }

  // Sends a batch of event envelopes to the ingestion sink, no-op if empty or disabled.
  async dispatch(events: WorkspaceEventEnvelope[]): Promise<void> {
    if (events.length === 0 || !this.isEnabled()) {
      return;
    }

    await this.workspaceEventSinkService.ingest(events);
  }

  // Returns a bound helper object for emitting workspace/object/pageview
  // events pre-scoped to a given workspace/user context.
  createContext(context?: EventContextFields) {
    const contextFields = computeEventContextFields(context);

    return {
      insertWorkspaceEvent: <T extends TrackEventName>(
        event: T,
        properties: TrackEventProperties<T>,
      ) =>
        this.emit(() =>
          buildWorkspaceEventEnvelope(contextFields, event, properties),
        ),
      createObjectEvent: <T extends TrackEventName>(
        event: T,
        properties: TrackEventProperties<T> & {
          recordId: string;
          objectMetadataId: string;
          isCustom?: boolean;
        },
      ) =>
        this.emit(() =>
          buildObjectEventEnvelope(contextFields, event, properties),
        ),
      createPageviewEvent: (
        name: string,
        properties: Partial<PageviewProperties>,
      ) =>
        this.emit(() => buildPageviewEnvelope(contextFields, name, properties)),
    };
  }

  // Builds and dispatches a single event envelope, catching and logging
  // errors so callers always get a { success } result rather than a throw.
  private async emit(
    buildEnvelope: () => WorkspaceEventEnvelope,
  ): Promise<{ success: boolean }> {
    try {
      await this.dispatch([buildEnvelope()]);

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to emit workspace event', error);

      return { success: false };
    }
  }
}
