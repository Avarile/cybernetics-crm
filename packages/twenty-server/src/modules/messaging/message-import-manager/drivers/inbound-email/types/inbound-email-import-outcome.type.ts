// Result of attempting to import one inbound email: successfully imported,
// no matching recipient/channel found, or the feature isn't configured.
export type InboundEmailImportOutcome =
  | { kind: 'imported'; workspaceId: string; messageChannelId: string }
  | { kind: 'unmatched'; recipient: string | null }
  | { kind: 'unconfigured' };
