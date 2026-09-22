// Describes a collision where a system side effect entity's universal
// identifier collides with a non-system entity already occupying that slot.

import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataSideEffectOperation } from 'src/engine/metadata-modules/metadata-side-effect/types/metadata-side-effect-operation.type';

export type SystemSideEffectUniversalIdentifierCollision = {
  metadataName: AllMetadataName;
  operation: MetadataSideEffectOperation;
  universalIdentifier: string;
  name?: string;
};
