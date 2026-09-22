// Job name and payload shape for the background job that installs the apps
// a user picked during onboarding.
export const INSTALL_ONBOARDING_APPS_JOB_NAME = 'InstallOnboardingAppsJob';

export type InstallOnboardingAppsJobData = {
  workspaceId: string;
  universalIdentifiers: string[];
};
