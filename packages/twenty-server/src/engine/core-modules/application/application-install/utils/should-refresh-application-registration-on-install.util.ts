import semver from 'semver';
import { isDefined } from 'twenty-shared/utils';

// Determines whether the app's registration metadata (available versions,
// manifest, etc.) should be refetched during install — true when the
// latest available version is missing/invalid, or when the version just
// installed is already at or ahead of what the registration knows about.
export const shouldRefreshApplicationRegistrationOnInstall = ({
  installedVersion,
  latestAvailableVersion,
}: {
  installedVersion: string;
  latestAvailableVersion: string | null;
}): boolean => {
  if (
    !isDefined(latestAvailableVersion) ||
    !isDefined(semver.valid(latestAvailableVersion))
  ) {
    return true;
  }

  if (!isDefined(semver.valid(installedVersion))) {
    return false;
  }

  return semver.gte(installedVersion, latestAvailableVersion);
};
