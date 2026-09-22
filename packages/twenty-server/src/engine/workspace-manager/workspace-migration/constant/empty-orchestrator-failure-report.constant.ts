import { ALL_METADATA_NAME } from 'twenty-shared/metadata';

import { type OrchestratorFailureReport } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';

// Builds an empty OrchestratorFailureReport with an empty failure list for every metadata kind, used
// as the starting accumulator when aggregating a workspace migration's validation failures
export const EMPTY_ORCHESTRATOR_FAILURE_REPORT =
  (): OrchestratorFailureReport =>
    (
      Object.keys(ALL_METADATA_NAME) as (keyof typeof ALL_METADATA_NAME)[]
    ).reduce(
      (orchestratorReport, metadataName) => ({
        ...orchestratorReport,
        [metadataName]: [],
      }),
      {} as OrchestratorFailureReport,
    );
