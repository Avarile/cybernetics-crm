// Type guard checking whether a feature flag key is publicly togglable.
import { type FeatureFlagKey } from 'twenty-shared/types';

import {
  PUBLIC_FEATURE_FLAGS,
  type PublicFeatureFlag,
} from 'src/engine/core-modules/feature-flag/constants/public-feature-flag.const';

// Type guard: whether a feature flag key is one of the publicly togglable flags.
export const isPublicFeatureFlag = (
  key: FeatureFlagKey,
): key is PublicFeatureFlag['key'] => {
  if (!key) {
    return false;
  }

  return PUBLIC_FEATURE_FLAGS.some((flag) => flag.key === key);
};
