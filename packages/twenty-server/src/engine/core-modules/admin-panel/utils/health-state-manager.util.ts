// Caches the last-known-good health check details so an indicator can still
// report useful diagnostics when a subsequent check fails.
export class HealthStateManager {
  private lastKnownState: {
    timestamp: Date;
    // oxlint-disable-next-line typescript/no-explicit-any
    details: Record<string, any>;
  } | null = null;

  // oxlint-disable-next-line typescript/no-explicit-any
  // Stores the latest successful health check details with a timestamp.
  updateState(details: Record<string, any>) {
    this.lastKnownState = {
      timestamp: new Date(),
      details,
    };
  }

  // Returns the last known state with its age in ms, or a placeholder if none exists.
  getStateWithAge() {
    return this.lastKnownState
      ? {
          ...this.lastKnownState,
          age: Date.now() - this.lastKnownState.timestamp.getTime(),
        }
      : 'No previous state available';
  }
}
