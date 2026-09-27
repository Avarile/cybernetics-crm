export type CustomWorkspaceEventBatch<WorkspaceEvent> = {
  name: string;
  // Optional, unlike WorkspaceEventBatch: custom events (see emitCustomBatchEvent)
  // aren't always scoped to a single workspace.
  workspaceId?: string;
  events: WorkspaceEvent[];
};
