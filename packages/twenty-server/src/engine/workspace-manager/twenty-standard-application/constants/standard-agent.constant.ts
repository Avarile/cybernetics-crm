// Registry of standard (built-in) AI agents seeded into every workspace, keyed by name with their fixed universal identifier
export const STANDARD_AGENT = {
  helper: {
    universalIdentifier: '20202020-c7ab-4065-b822-0ca1d5de60a9',
  },
} as const satisfies Record<
  string,
  {
    universalIdentifier: string;
  }
>;
