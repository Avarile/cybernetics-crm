import { type WorkspaceModelAvailabilitySettings } from 'src/engine/metadata-modules/ai/ai-models/utils/is-model-allowed.util';

// True if the workspace's model policy resolves to at least one usable
// model, used to validate auto-select is viable.
export const workspaceHasEnabledModels = (
  availabilitySettings: WorkspaceModelAvailabilitySettings,
  recommendedModelIds?: Set<string>,
): boolean => {
  if (availabilitySettings.useRecommendedModels) {
    return (recommendedModelIds?.size ?? 0) > 0;
  }

  return availabilitySettings.enabledAiModelIds.length > 0;
};
