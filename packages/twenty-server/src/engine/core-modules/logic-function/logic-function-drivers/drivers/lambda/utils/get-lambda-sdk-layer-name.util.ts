// Builds a workspace/application-scoped SDK layer name.
export const getLambdaSdkLayerName = ({
  workspaceId,
  applicationUniversalIdentifier,
}: {
  workspaceId: string;
  applicationUniversalIdentifier: string;
}): string => `sdk-${workspaceId}-${applicationUniversalIdentifier}`;
