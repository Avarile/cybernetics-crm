import { ALL_METADATA_NAME } from 'twenty-shared/metadata';

import { type OrchestratorActionsReport } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';
import { getMetadataEmptyWorkspaceMigrationActionRecord } from 'src/engine/workspace-manager/workspace-migration/utils/get-metadata-empty-workspace-migration-action-record.util';

// Builds an empty OrchestratorActionsReport with a zeroed-out action record for every metadata kind,
// used as the starting accumulator when aggregating a workspace migration's build results
export const createEmptyOrchestratorActionsReport =
  (): OrchestratorActionsReport =>
    (
      Object.keys(ALL_METADATA_NAME) as (keyof typeof ALL_METADATA_NAME)[]
    ).reduce(
      (orchestratorReport, metadataName) => ({
        ...orchestratorReport,
        [metadataName]:
          getMetadataEmptyWorkspaceMigrationActionRecord(metadataName),
      }),
      {} as OrchestratorActionsReport,
    );
