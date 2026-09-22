import { applyWorkspaceSentryFields } from 'src/engine/core-modules/sentry/utils/apply-workspace-sentry-fields.util';

// Extracts workspaceId/userWorkspaceId from an arbitrary background job's
// data payload and applies them as Sentry context, if present.
export const applyWorkspaceSentryContextFromJobData = (
  jobData: unknown,
): void => {
  if (typeof jobData !== 'object' || jobData === null) {
    return;
  }

  const workspaceId = (jobData as { workspaceId?: unknown }).workspaceId;
  const userWorkspaceId = (jobData as { userWorkspaceId?: unknown })
    .userWorkspaceId;

  if (typeof workspaceId !== 'string' || workspaceId.length === 0) {
    return;
  }

  applyWorkspaceSentryFields({
    workspaceId,
    userWorkspaceId:
      typeof userWorkspaceId === 'string' && userWorkspaceId.length > 0
        ? userWorkspaceId
        : undefined,
  });
};
