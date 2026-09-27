import { type AllMetadataName } from 'twenty-shared/metadata';

import { type WorkspaceMigrationBuilderOptions } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-builder-options.type';

// The option can be a single boolean applying to every metadata type, or a per-type
// map for callers that only want deletion inferred (an entity present "before" but
// absent from the new payload treated as deleted) for some metadata types.
export const shouldInferDeletionFromMissingEntities = ({
  buildOptions,
  metadataName,
}: {
  buildOptions: WorkspaceMigrationBuilderOptions;
  metadataName: AllMetadataName;
}): boolean => {
  return (
    buildOptions.inferDeletionFromMissingEntities === true ||
    buildOptions.inferDeletionFromMissingEntities?.[metadataName] === true
  );
};
