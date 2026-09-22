import { type STANDARD_ROLE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';

// Union of all standard role keys, derived from the STANDARD_ROLE registry
export type AllStandardRoleName = keyof typeof STANDARD_ROLE;
