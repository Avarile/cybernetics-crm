// Generic track-event schema/type plus the registry each specific event
// schema registers itself into, merged with the base event fields.
import { z } from 'zod';

import { baseEventSchema } from 'src/engine/core-modules/event-logs/emit/events/common/base-schemas';

export const genericTrackSchema = baseEventSchema.extend({
  type: z.literal('track'),
  event: z.string(),
  properties: z.any(),
});

export type GenericTrackEvent<E extends string = string> = {
  type: 'track';
  event: E;
  // oxlint-disable-next-line typescript/no-explicit-any
  properties: any;
  timestamp: string;
  version: string;
  userId?: string;
  workspaceId?: string;
};

// oxlint-disable-next-line typescript/no-explicit-any
export const eventsRegistry = new Map<string, z.ZodSchema<any>>();

// oxlint-disable-next-line typescript/no-explicit-any
// Registers an event's Zod schema (merged with the generic track schema) under its name.
export function registerEvent<E extends string, S extends z.ZodObject<any>>(
  event: E,
  schema: S,
): void {
  eventsRegistry.set(event, genericTrackSchema.merge(schema));
}
