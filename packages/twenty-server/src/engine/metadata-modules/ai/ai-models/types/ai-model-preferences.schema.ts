import { z } from 'zod';

// Validation schema for stored AI model preference config variables.
export const aiModelPreferencesSchema = z.object({
  disabledModels: z.array(z.string()).optional(),
  recommendedModels: z.array(z.string()).optional(),
  defaultFastModels: z.array(z.string()).optional(),
  defaultSmartModels: z.array(z.string()).optional(),
});
