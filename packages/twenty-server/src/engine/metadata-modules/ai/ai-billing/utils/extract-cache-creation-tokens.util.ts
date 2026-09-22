type ProviderMetadataLike = Record<string, Record<string, unknown> | undefined>;

// Anthropic and Bedrock report cache creation tokens in provider metadata
// rather than the standard usage object. Anthropic exposes it as a
// top-level camelCase field; Bedrock nests it under `usage`.
// Sums cache creation tokens across all steps of a generation.
export const extractCacheCreationTokensFromSteps = (
  steps: Array<{ providerMetadata?: ProviderMetadataLike }>,
): number => {
  return steps.reduce((sum, step) => {
    return sum + extractCacheCreationTokens(step.providerMetadata);
  }, 0);
};

// Reads cache creation tokens out of a single step's provider metadata,
// checking the Anthropic and Bedrock provider-specific shapes.
export const extractCacheCreationTokens = (
  providerMetadata: ProviderMetadataLike | undefined,
): number => {
  const anthropicMeta = providerMetadata?.anthropic as
    | Record<string, unknown>
    | undefined;
  const bedrockUsage = (providerMetadata?.bedrock as Record<string, unknown>)
    ?.usage as Record<string, unknown> | undefined;

  return (
    (anthropicMeta?.cacheCreationInputTokens as number | undefined) ??
    (bedrockUsage?.cacheWriteInputTokens as number | undefined) ??
    0
  );
};
