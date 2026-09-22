import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatSkill } from 'src/engine/metadata-modules/flat-skill/types/flat-skill.type';

// Denormalized, id/universal-identifier indexed collection of all flat skills in a workspace.
export type FlatSkillMaps = FlatEntityMaps<FlatSkill>;
