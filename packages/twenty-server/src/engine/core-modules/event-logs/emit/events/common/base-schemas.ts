// Shared Zod fields (timestamp, context ids, version) extended by every event schema.
import { z } from 'zod';

export const baseEventSchema = z.strictObject({
  timestamp: z.string(),
  userId: z.string().nullish(),
  workspaceId: z.string().nullish(),
  version: z.string(),
});
