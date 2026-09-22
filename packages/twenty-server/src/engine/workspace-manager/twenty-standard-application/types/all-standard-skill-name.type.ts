import type { STANDARD_SKILL } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-skill.constant';

// Union of all standard skill keys, derived from the STANDARD_SKILL registry
export type AllStandardSkillName = keyof typeof STANDARD_SKILL;
