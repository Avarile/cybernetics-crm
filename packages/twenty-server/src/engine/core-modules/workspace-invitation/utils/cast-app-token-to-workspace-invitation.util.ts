// Converts an AppToken entity into the public WorkspaceInvitation DTO shape.
import { type AppTokenEntity } from 'src/engine/core-modules/app-token/app-token.entity';
import { INVITATION_APP_TOKEN_TYPES } from 'src/engine/core-modules/workspace-invitation/constants/invitation-app-token-types';
import {
  WorkspaceInvitationException,
  WorkspaceInvitationExceptionCode,
} from 'src/engine/core-modules/workspace-invitation/workspace-invitation.exception';

// Converts an AppToken entity into the public WorkspaceInvitation shape,
// validating it is an invitation-type token with an email in its context.
export const castAppTokenToWorkspaceInvitationUtil = (
  appToken: AppTokenEntity,
) => {
  if (!INVITATION_APP_TOKEN_TYPES.includes(appToken.type)) {
    throw new WorkspaceInvitationException(
      `Token type must be one of "${INVITATION_APP_TOKEN_TYPES.join('", "')}"`,
      WorkspaceInvitationExceptionCode.INVALID_APP_TOKEN_TYPE,
    );
  }

  if (!appToken.context?.email) {
    throw new WorkspaceInvitationException(
      `Invitation corrupted: Missing email in context`,
      WorkspaceInvitationExceptionCode.INVITATION_CORRUPTED,
    );
  }

  return {
    id: appToken.id,
    email: appToken.context.email,
    roleId: appToken.context.roleId ?? null,
    expiresAt: appToken.expiresAt,
  };
};
