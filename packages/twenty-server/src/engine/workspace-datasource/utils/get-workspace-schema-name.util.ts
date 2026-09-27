import { uuidToBase36 } from 'twenty-shared/utils';

export const getWorkspaceSchemaName = (workspaceId: string): string => {
  // Base36 (not the raw UUID) because Postgres identifiers can't contain hyphens
  // unquoted, and the shorter form stays well under the 63-byte identifier limit.
  return `workspace_${uuidToBase36(workspaceId)}`;
};
