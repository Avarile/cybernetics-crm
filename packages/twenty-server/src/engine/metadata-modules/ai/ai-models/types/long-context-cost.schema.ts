import { z } from 'zod';

// Validation schema for a model's alternate pricing tier applied once input
// tokens exceed the given threshold.
export const longContextCostSchema = z.object({
  inputCostPerMillionTokens: z.number(),
  outputCostPerMillionTokens: z.number(),
  cachedInputCostPerMillionTokens: z.number().optional(),
  cacheCreationCostPerMillionTokens: z.number().optional(),
  thresholdTokens: z.number(),
});
