import { type AllMetadataName } from 'twenty-shared/metadata';

import { type WorkspaceMigrationActionType } from 'src/engine/metadata-modules/flat-entity/types/metadata-workspace-migration-action.type';
import { type FailedFlatEntityValidation } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/types/failed-flat-entity-validation.type';

// API-facing shape for reporting a failed workspace migration build: a per-metadata-kind error count
// summary plus the detailed validation failures for each metadata kind that had any
export type MetadataValidationErrorResponseDescriptor = {
  summary: {
    totalErrors: number;
  } & Partial<Record<AllMetadataName, number>>;
  errors: Partial<{
    [P in AllMetadataName]: FailedFlatEntityValidation<
      P,
      WorkspaceMigrationActionType
    >[];
  }>;
};
