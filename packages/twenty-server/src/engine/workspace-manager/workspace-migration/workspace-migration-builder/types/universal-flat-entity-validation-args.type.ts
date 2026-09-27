import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataUniversalFlatEntityAndRelatedFlatEntityMapsForValidation } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity-and-related-flat-entity-maps-for-validation.type';
import { type MetadataUniversalFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-universal-flat-entity.type';
import { type WorkspaceMigrationBuilderAdditionalCacheDataMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-builder-additional-cache-data-maps.type';
import { type MetadataUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/metadata-universal-flat-entity-maps.type';
import { type WorkspaceMigrationBuilderOptions } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-builder-options.type';

export type UniversalFlatEntityValidationArgs<T extends AllMetadataName> = {
  additionalCacheDataMaps: WorkspaceMigrationBuilderAdditionalCacheDataMaps;
  flatEntityToValidate: MetadataUniversalFlatEntity<T>;
  optimisticFlatEntityMapsAndRelatedFlatEntityMaps: MetadataUniversalFlatEntityAndRelatedFlatEntityMapsForValidation<T>;
  workspaceId: string;
  // The rest of this same create/delete batch not yet processed in the loop (see
  // WorkspaceEntityMigrationBuilderService). Lets a validator confirm a forward
  // reference (e.g. a folder that hasn't been created yet but is later in this batch)
  // will actually be satisfied by the time the whole migration finishes, instead of
  // failing just because optimisticFlatEntityMapsAndRelatedFlatEntityMaps doesn't have
  // it yet.
  remainingFlatEntityMapsToValidate: MetadataUniversalFlatEntityMaps<T>;
  buildOptions: WorkspaceMigrationBuilderOptions;
};
