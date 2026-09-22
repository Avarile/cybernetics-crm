// Operation types side effect handlers can register for, plus helpers for
// building the registry's composite lookup key and handler descriptor shape.

import { type AllMetadataName } from 'twenty-shared/metadata';

export type MetadataSideEffectOperation = 'create' | 'update' | 'delete';

export const METADATA_SIDE_EFFECT_OPERATIONS = [
  'create',
  'update',
  'delete',
] as const satisfies readonly MetadataSideEffectOperation[];

export type MetadataSideEffectHandlerKey =
  `${MetadataSideEffectOperation}:${AllMetadataName}`;

// Builds the "operation:metadataName" key used to index handlers in the registry.
export const buildMetadataSideEffectHandlerKey = (
  operation: MetadataSideEffectOperation,
  metadataName: AllMetadataName,
): MetadataSideEffectHandlerKey => `${operation}:${metadataName}`;

export type MetadataSideEffectHandlerDescriptor = {
  operation: MetadataSideEffectOperation;
  metadataName: AllMetadataName;
  name: string;
  description: string;
};
