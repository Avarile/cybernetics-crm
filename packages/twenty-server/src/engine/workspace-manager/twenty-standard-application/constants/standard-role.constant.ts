// Registry of standard roles seeded into every workspace, keyed by name with their fixed universal identifier
export const STANDARD_ROLE = {
  admin: { universalIdentifier: '20202020-02c2-43f2-b94d-cab1f2b532eb' },
} as const satisfies Record<string, { universalIdentifier: string }>;
