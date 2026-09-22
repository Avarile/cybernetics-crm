import { type FlatSkill } from 'src/engine/metadata-modules/flat-skill/types/flat-skill.type';
import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { addFlatEntityToFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/add-flat-entity-to-flat-entity-maps-or-throw.util';
import { type CreateStandardSkillArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/skill-metadata/create-standard-skill-flat-metadata.util';
import { STANDARD_FLAT_SKILL_METADATA_BUILDERS_BY_SKILL_NAME } from 'src/engine/workspace-manager/twenty-standard-application/utils/skill-metadata/create-standard-flat-skill-metadata.util';

// Builds every standard skill's flat metadata and assembles them into a single FlatEntityMaps, used
// as the "target" state when seeding or syncing a workspace's standard agent skills
export const buildStandardFlatSkillMetadataMaps = (
  args: Omit<CreateStandardSkillArgs, 'context'>,
): FlatEntityMaps<FlatSkill> => {
  const allSkillMetadatas: FlatSkill[] = Object.values(
    STANDARD_FLAT_SKILL_METADATA_BUILDERS_BY_SKILL_NAME,
  ).map((builder) => builder(args));

  let flatSkillMetadataMaps = createEmptyFlatEntityMaps();

  for (const skillMetadata of allSkillMetadatas) {
    flatSkillMetadataMaps = addFlatEntityToFlatEntityMapsOrThrow({
      flatEntity: skillMetadata,
      flatEntityMaps: flatSkillMetadataMaps,
    });
  }

  return flatSkillMetadataMaps;
};
