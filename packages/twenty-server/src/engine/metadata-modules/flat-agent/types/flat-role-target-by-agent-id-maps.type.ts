import { type FlatRoleTarget } from 'src/engine/metadata-modules/flat-role-target/types/flat-role-target.type';

// Map from agent id to the flat role target assigned to that agent, if any.
export type FlatRoleTargetByAgentIdMaps = Partial<
  Record<string, FlatRoleTarget>
>;
