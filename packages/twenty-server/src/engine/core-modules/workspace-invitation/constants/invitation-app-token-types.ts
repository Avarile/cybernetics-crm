import { AppTokenType } from 'src/engine/core-modules/app-token/app-token.entity';

// AppToken types that represent a workspace invitation (regular or
// onboarding flow).
export const INVITATION_APP_TOKEN_TYPES: readonly AppTokenType[] = [
  AppTokenType.InvitationToken,
  AppTokenType.OnboardingInvitationToken,
];
