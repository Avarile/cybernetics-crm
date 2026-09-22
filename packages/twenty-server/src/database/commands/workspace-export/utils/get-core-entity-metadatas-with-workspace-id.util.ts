import { DataSource } from 'typeorm';

// Finds every core-schema entity that has a workspaceId column, i.e. the ones
// that need filtering to a single workspace when exporting.
export const getCoreEntityMetadatasWithWorkspaceId = (
  dataSource: DataSource,
) => {
  return dataSource.entityMetadatas.filter((entityMetadata) =>
    entityMetadata.columns.some(
      (column) => column.propertyName === 'workspaceId',
    ),
  );
};
