// Builders assembling the table/row envelopes stored for workspace events,
// object events and pageviews, attaching workspace/user context fields.
import {
  type TrackEventName,
  type TrackEventProperties,
} from 'src/engine/core-modules/event-logs/emit/events.type';
import {
  type EventContextFields,
  type WorkspaceEventEnvelope,
} from 'src/engine/core-modules/event-logs/types/workspace-event-envelope.type';
import {
  makePageview,
  makeTrackEvent,
} from 'src/engine/core-modules/event-logs/emit/analytics.utils';
import { type PageviewProperties } from 'src/engine/core-modules/event-logs/emit/events/pageview/pageview';

// Strips undefined workspaceId/userId from event context, keeping only defined fields.
export const computeEventContextFields = (
  context?: EventContextFields,
): EventContextFields => ({
  ...(context?.workspaceId ? { workspaceId: context.workspaceId } : {}),
  ...(context?.userId ? { userId: context.userId } : {}),
});

// Builds a workspaceEvent-table envelope for a track event.
export const buildWorkspaceEventEnvelope = <T extends TrackEventName>(
  contextFields: EventContextFields,
  event: T,
  properties: TrackEventProperties<T>,
): WorkspaceEventEnvelope => ({
  table: 'workspaceEvent',
  row: { ...contextFields, ...makeTrackEvent(event, properties) },
});

// Builds an objectEvent-table envelope, pulling recordId/objectMetadataId/
// isCustom out of the properties into top-level row fields.
export const buildObjectEventEnvelope = <T extends TrackEventName>(
  contextFields: EventContextFields,
  event: T,
  properties: TrackEventProperties<T> & {
    recordId: string;
    objectMetadataId: string;
    isCustom?: boolean;
  },
): WorkspaceEventEnvelope => {
  const { recordId, objectMetadataId, isCustom, ...restProperties } =
    properties;

  return {
    table: 'objectEvent',
    row: {
      ...contextFields,
      ...makeTrackEvent(
        event,
        restProperties as unknown as TrackEventProperties<T>,
      ),
      recordId,
      objectMetadataId,
      isCustom,
    },
  };
};

// Builds a pageview-table envelope.
export const buildPageviewEnvelope = (
  contextFields: EventContextFields,
  name: string,
  properties: Partial<PageviewProperties>,
): WorkspaceEventEnvelope => ({
  table: 'pageview',
  row: { ...contextFields, ...makePageview(name, properties) },
});
