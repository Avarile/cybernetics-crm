import { z } from 'zod';

import { longContextCostSchema } from 'src/engine/metadata-modules/ai/ai-models/types/long-context-cost.schema';

// A model's alternate pricing tier applied above a token threshold.
export type LongContextCost = z.infer<typeof longContextCostSchema>;
