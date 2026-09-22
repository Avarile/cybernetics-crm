import { z } from 'zod';

import { aiProviderConfigSchema } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-config.schema';

// Validation schema for the full provider-name-keyed AI providers config map.
export const aiProvidersConfigSchema = z.record(
  z.string(),
  aiProviderConfigSchema,
);
