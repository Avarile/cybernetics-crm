const COMPOSITE_SEPARATOR = '/';

// Builds the `provider/modelName` composite id used as the workspace model
// id, unless the model name already includes the provider as its prefix.
export const buildCompositeModelId = (
  providerName: string,
  modelName: string,
): string => {
  if (providerName === modelName.split(COMPOSITE_SEPARATOR)[0]) {
    return modelName;
  }

  return `${providerName}${COMPOSITE_SEPARATOR}${modelName}`;
};
