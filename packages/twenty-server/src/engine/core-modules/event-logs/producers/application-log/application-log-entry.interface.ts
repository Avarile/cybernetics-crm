// A single parsed log line produced by a running logic function execution.
export type ApplicationLogEntry = {
  timestamp: Date;
  workspaceId: string;
  applicationId: string;
  logicFunctionId: string;
  logicFunctionName: string;
  executionId: string;
  level: string;
  message: string;
};
