import { z } from 'zod';

import { aiProviderConfigSchema } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-config.schema';
import { type AiProviderModelConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-model-config.type';

// Inferred type of a single AI provider's configuration, from its schema.
export type AiProviderConfig = Omit<
  z.infer<typeof aiProviderConfigSchema>,
  'models'
> & {
  models?: AiProviderModelConfig[];
};
