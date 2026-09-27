import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataUniversalFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-universal-flat-entity.type';
import { type WORKSPACE_MIGRATION_ACTION_TYPE } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/constants/workspace-migration-action-type.constant';

export type BaseUniversalDeleteWorkspaceMigrationAction<
  T extends AllMetadataName,
> = {
  universalIdentifier: string;
  type: typeof WORKSPACE_MIGRATION_ACTION_TYPE.delete;
  metadataName: T;
  // The full pre-deletion entity, attached by the base builder service so cross-entity
  // validators running later in the same build (e.g. "is this permission flag still
  // referenced elsewhere?") can inspect what's being deleted without a separate lookup.
  flatEntity?: MetadataUniversalFlatEntity<T>;
};
