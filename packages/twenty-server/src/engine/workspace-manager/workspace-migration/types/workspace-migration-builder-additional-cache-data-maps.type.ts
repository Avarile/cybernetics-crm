import { type AdditionalCacheDataMaps } from 'src/engine/workspace-cache/types/workspace-cache-key.type';
import { type WORKSPACE_MIGRATION_ADDITIONAL_CACHE_DATA_MAPS_KEY } from 'src/engine/workspace-manager/workspace-migration/constant/workspace-migration-additional-cache-data-maps-key.constant';

// Subset of the workspace cache's additional data maps that workspace migration builders may need
export type WorkspaceMigrationBuilderAdditionalCacheDataMaps = Pick<
  AdditionalCacheDataMaps,
  (typeof WORKSPACE_MIGRATION_ADDITIONAL_CACHE_DATA_MAPS_KEY)[number]
>;
