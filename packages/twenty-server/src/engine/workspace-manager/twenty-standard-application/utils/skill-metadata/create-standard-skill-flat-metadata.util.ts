import { v4 } from 'uuid';

import { type FlatSkill } from 'src/engine/metadata-modules/flat-skill/types/flat-skill.type';
import { TWENTY_STANDARD_APPLICATION } from 'src/engine/workspace-manager/twenty-standard-application/constants/twenty-standard-applications';
import { STANDARD_SKILL } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-skill.constant';
import { type AllStandardSkillName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-skill-name.type';
import { type StandardBuilderArgs } from 'src/engine/workspace-manager/twenty-standard-application/types/metadata-standard-buillder-args.type';

// Per-skill content (label, icon, instruction markdown) supplied by each standard skill's builder
export type CreateStandardSkillContext = {
  skillName: AllStandardSkillName;
  name: string;
  label: string;
  icon: string | null;
  description: string | null;
  content: string;
  isCustom: boolean;
  isActive?: boolean;
};

// Arguments accepted by createStandardSkillFlatMetadata
export type CreateStandardSkillArgs = StandardBuilderArgs<'skill'> & {
  context: CreateStandardSkillContext;
};

// Builds a single standard skill's FlatSkill, resolving its universal identifier from STANDARD_SKILL
export const createStandardSkillFlatMetadata = ({
  context: {
    skillName,
    name,
    label,
    icon,
    description,
    content,
    isCustom,
    isActive = true,
  },
  workspaceId,
  twentyStandardApplicationId,
  now,
}: CreateStandardSkillArgs): FlatSkill => {
  const universalIdentifier = STANDARD_SKILL[skillName].universalIdentifier;

  return {
    id: v4(),
    universalIdentifier,
    name,
    label,
    icon,
    description,
    content,
    isCustom,
    isActive,
    workspaceId,
    applicationId: twentyStandardApplicationId,
    applicationUniversalIdentifier:
      TWENTY_STANDARD_APPLICATION.universalIdentifier,
    createdAt: now,
    updatedAt: now,
  };
};
