import semver from 'semver';

// Normalizes a semver string to its "major.minor.patch" form, dropping any
// pre-release/build metadata; returns null if the version can't be parsed.
export const extractVersionMajorMinorPatch = (version: string | undefined) => {
  const parsed = semver.parse(version);

  if (parsed === null) {
    return null;
  }

  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
};
