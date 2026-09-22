// Determines whether the workspace's custom application is acting on an
// entity it doesn't own (belongs to another app, or is a system side
// effect), meaning the change should be recorded as an override rather
// than a direct mutation.
export const isCallerOverridingEntity = ({
  callerApplicationUniversalIdentifier,
  entityApplicationUniversalIdentifier,
  workspaceCustomApplicationUniversalIdentifier,
  isSystemSideEffect,
}: {
  callerApplicationUniversalIdentifier: string;
  entityApplicationUniversalIdentifier: string;
  workspaceCustomApplicationUniversalIdentifier: string;
  isSystemSideEffect: boolean;
}): boolean => {
  return (
    callerApplicationUniversalIdentifier ===
      workspaceCustomApplicationUniversalIdentifier &&
    (entityApplicationUniversalIdentifier !==
      workspaceCustomApplicationUniversalIdentifier ||
      isSystemSideEffect)
  );
};
