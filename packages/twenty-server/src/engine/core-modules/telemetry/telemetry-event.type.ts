// Shape of a single self-hosting telemetry event sent to the telemetry
// collection endpoint.
export type TelemetryEventType = {
  workspaceId?: string;
  userWorkspaceId?: string;
  userId: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  locale?: string;
  serverUrl: string;
  serverId: string;
};
