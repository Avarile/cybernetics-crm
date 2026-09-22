import { type WorkspaceMigrationOrchestratorFailedResult } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';

// Thrown when a workspace migration build fails validation; carries the full failure report so
// callers can inspect exactly which entities failed and why
export class WorkspaceMigrationBuilderException extends Error {
  constructor(
    public readonly failedWorkspaceMigrationBuildResult: WorkspaceMigrationOrchestratorFailedResult,
    message = 'Workspace migration builder failed',
  ) {
    super(message);
    this.name = 'WorkspaceMigrationBuilderException';
  }
}
