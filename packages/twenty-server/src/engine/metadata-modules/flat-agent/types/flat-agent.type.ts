import { type AgentEntity } from 'src/engine/metadata-modules/ai/ai-agent/entities/agent.entity';
import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';

// Flat (denormalized) representation of an AgentEntity used during workspace metadata diffing.
export type FlatAgent = FlatEntityFrom<AgentEntity>;

// A flat agent enriched with its resolved role id, for contexts that need the agent-role link.
export type FlatAgentWithRoleId = FlatAgent & { roleId: string | null };
