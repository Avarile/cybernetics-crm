// Map of every feature flag key to whether it's enabled for a workspace.
import { type FeatureFlagKey } from 'twenty-shared/types';

export type FeatureFlagMap = Record<`${FeatureFlagKey}`, boolean>;
