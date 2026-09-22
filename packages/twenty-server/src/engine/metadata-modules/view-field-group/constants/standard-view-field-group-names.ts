import { msg } from '@lingui/core/macro';

// Returns the translatable message descriptors for the built-in view
// field group names shipped with standard objects.
export const getStandardViewFieldGroupNames = () => [
  msg`General`,
  msg`System`,
  msg`Work`,
  msg`Social`,
  msg`Deal`,
  msg`Relations`,
  msg`Business`,
  msg`Contact`,
];
