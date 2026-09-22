import { isAutoSelectModelId } from 'twenty-shared/utils';

// A workspace's model access policy: either restrict to recommended models,
// or use an explicit allow-list of enabled model ids.
export type WorkspaceModelAvailabilitySettings = {
  useRecommendedModels: boolean;
  enabledAiModelIds: string[];
};

// Checks a model against the workspace's availability policy; auto-select is always allowed.
export const isModelAllowedByWorkspace = (
  modelId: string,
  availabilitySettings: WorkspaceModelAvailabilitySettings,
  recommendedModelIds?: Set<string>,
): boolean => {
  if (isAutoSelectModelId(modelId)) {
    return true;
  }

  if (availabilitySettings.useRecommendedModels) {
    return recommendedModelIds?.has(modelId) ?? false;
  }

  return availabilitySettings.enabledAiModelIds.includes(modelId);
};
