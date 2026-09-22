import { z } from 'zod';

import { aiProviderModelConfigSchema } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-model-config.schema';

// Whether a model definition came from the base catalog or was added manually by an admin.
export type AiModelSource = 'catalog' | 'manual';

export type AiProviderModelConfig = z.infer<
  typeof aiProviderModelConfigSchema
> & {
  source?: AiModelSource;
};
