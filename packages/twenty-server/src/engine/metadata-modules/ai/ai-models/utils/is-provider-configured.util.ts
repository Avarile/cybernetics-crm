import { type AiProviderConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-config.type';

// True if the provider has any form of credential set, so it can be instantiated.
export const isProviderConfigured = (config: AiProviderConfig): boolean =>
  !!(config.apiKey || config.accessKeyId || config.authType);
