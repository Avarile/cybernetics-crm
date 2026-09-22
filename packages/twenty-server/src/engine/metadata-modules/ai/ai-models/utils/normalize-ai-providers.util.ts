import { type AiProviderModelConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-model-config.type';
import { type AiProvidersConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-providers-config.type';

// Fills in each provider's `name` from its key and tags all catalog models
// with `source: 'catalog'`, so catalog-loaded providers/models have a
// consistent shape before being merged with custom ones.
export const normalizeAiProviders = (
  raw: AiProvidersConfig,
): AiProvidersConfig => {
  const result: AiProvidersConfig = {};

  for (const [key, config] of Object.entries(raw)) {
    result[key] = {
      ...config,
      name: key,
      models: (config.models ?? []).map(
        (model): AiProviderModelConfig => ({ ...model, source: 'catalog' }),
      ),
    };
  }

  return result;
};
