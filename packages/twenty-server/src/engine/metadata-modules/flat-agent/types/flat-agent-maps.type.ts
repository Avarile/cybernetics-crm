import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatAgent } from 'src/engine/metadata-modules/flat-agent/types/flat-agent.type';

// Denormalized, id/universal-identifier indexed collection of all flat agents in a workspace.
export type FlatAgentMaps = FlatEntityMaps<FlatAgent>;
