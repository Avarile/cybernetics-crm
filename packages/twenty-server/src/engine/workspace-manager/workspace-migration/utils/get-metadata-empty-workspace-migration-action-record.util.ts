import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataUniversalWorkspaceMigrationActionsRecord } from 'src/engine/metadata-modules/flat-entity/types/metadata-workspace-migration-action.type';

// _metadataName is unused at runtime; it only exists so callers can pass a metadata
// name and have T inferred, giving the returned record the right entity-specific typing.
export const getMetadataEmptyWorkspaceMigrationActionRecord = <
  T extends AllMetadataName,
>(
  _metadataName: T,
) =>
  ({
    create: [],
    delete: [],
    update: [],
  }) as MetadataUniversalWorkspaceMigrationActionsRecord<T>;
