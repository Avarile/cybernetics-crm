import { escapeIdentifier } from 'src/engine/workspace-manager/workspace-migration/utils/remove-sql-injection.util';

// Builds the "INSERT INTO schema.table (cols) VALUES " prefix shared by every
// multi-row insert statement written for a table's batch of rows.
export const buildInsertPrefix = (
  schemaName: string,
  tableName: string,
  columnNames: string[],
): string => {
  const escapedColumnNames = columnNames.map(escapeIdentifier).join(', ');

  return `INSERT INTO ${escapeIdentifier(schemaName)}.${escapeIdentifier(tableName)} (${escapedColumnNames}) VALUES `;
};
