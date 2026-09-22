import { type STANDARD_AGENT } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-agent.constant';

// Union of all standard agent keys, derived from the STANDARD_AGENT registry
export type AllStandardAgentName = keyof typeof STANDARD_AGENT;
