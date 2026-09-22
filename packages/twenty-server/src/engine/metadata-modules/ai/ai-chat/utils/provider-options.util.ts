// Per-SDK-package provider options for prompt caching, used to opt Bedrock
// into cache points, Anthropic into ephemeral cache control, and OpenAI into
// disabling response storage while enabling its own prompt cache key.
import { type ProviderOptions } from '@ai-sdk/provider-utils';
import { type ModelMessage } from 'ai';
import { type AiSdkPackage } from 'twenty-shared/ai';

import {
  AI_SDK_ANTHROPIC,
  AI_SDK_BEDROCK,
  AI_SDK_OPENAI,
} from 'src/engine/metadata-modules/ai/ai-models/constants/ai-sdk-package.const';

// Message-level provider options enabling prompt caching for providers that need it per-message.
export const getCacheProviderOptions = (
  sdkPackage: AiSdkPackage,
): ProviderOptions | undefined => {
  switch (sdkPackage) {
    case AI_SDK_BEDROCK:
      return { bedrock: { cachePoint: { type: 'default' } } };
    default:
      return undefined;
  }
};
// Call-level provider options (as opposed to per-message), for providers
// whose caching/storage behavior is configured on the request as a whole.
export const getCallLevelProviderOptions = ({
  sdkPackage,
  providerOptions,
  promptCacheKey,
}: {
  sdkPackage: AiSdkPackage;
  providerOptions?: ProviderOptions;
  promptCacheKey?: string;
}): ProviderOptions | undefined => {
  switch (sdkPackage) {
    case AI_SDK_ANTHROPIC:
      return {
        ...(providerOptions ?? {}),
        anthropic: { cacheControl: { type: 'ephemeral' } },
      };
    case AI_SDK_OPENAI:
      return {
        ...(providerOptions ?? {}),
        openai: { store: false, ...(promptCacheKey ? { promptCacheKey } : {}) },
      };
    default:
      return providerOptions;
  }
};

// Attaches a cache breakpoint's provider options onto the last message only,
// for providers where caching is controlled per-message.
export const injectCacheBreakpoint = (
  messages: ModelMessage[],
  sdkPackage: AiSdkPackage,
): ModelMessage[] => {
  if (messages.length === 0) return messages;

  const cacheOptions = getCacheProviderOptions(sdkPackage);

  if (!cacheOptions) return messages;

  const lastIdx = messages.length - 1;

  return messages.map((message, index) => {
    if (index !== lastIdx) return message;

    return {
      ...message,
      providerOptions: {
        ...(message.providerOptions ?? {}),
        ...cacheOptions,
      },
    };
  });
};
