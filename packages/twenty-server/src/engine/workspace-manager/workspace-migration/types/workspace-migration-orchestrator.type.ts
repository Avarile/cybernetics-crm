import { type AllMetadataName } from 'twenty-shared/metadata';
import { type FromTo } from 'twenty-shared/types';

import {
  type MetadataUniversalWorkspaceMigrationActionsRecord,
  type WorkspaceMigrationActionType,
} from 'src/engine/metadata-modules/flat-entity/types/metadata-workspace-migration-action.type';
import { type WorkspaceMigrationBuilderAdditionalCacheDataMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-builder-additional-cache-data-maps.type';
import { type AllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/all-universal-flat-entity-maps.type';
import { type FailedFlatEntityValidation } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/types/failed-flat-entity-validation.type';
import { type WorkspaceMigrationBuilderOptions } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-builder-options.type';
import { type WorkspaceMigration } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration.type';

// Per-metadata-kind pair of "from" (current) and "to" (target) universal flat entity maps that a
// workspace migration build diffs against
export type FromToAllUniversalFlatEntityMaps = {
  [P in keyof AllUniversalFlatEntityMaps]?: FromTo<
    AllUniversalFlatEntityMaps[P]
  >;
};

// Arguments accepted by WorkspaceMigrationBuildOrchestratorService.buildWorkspaceMigration
export type WorkspaceMigrationOrchestratorBuildArgs = {
  workspaceId: string;
  buildOptions: WorkspaceMigrationBuilderOptions;
  fromToAllFlatEntityMaps: FromToAllUniversalFlatEntityMaps;
  additionalCacheDataMaps: WorkspaceMigrationBuilderAdditionalCacheDataMaps;
  /**
   * Dependency maps must contain current application and its dependent app app flat entity maps
   */
  dependencyAllFlatEntityMaps?: Partial<AllUniversalFlatEntityMaps>;
};

// Validation failures collected during a workspace migration build, grouped by metadata kind
export type OrchestratorFailureReport = {
  [P in AllMetadataName]: FailedFlatEntityValidation<
    P,
    WorkspaceMigrationActionType
  >[];
};

// Generated create/update/delete actions collected during a workspace migration build, grouped by metadata kind
export type OrchestratorActionsReport = {
  [P in AllMetadataName]: MetadataUniversalWorkspaceMigrationActionsRecord<P>;
};

// Result of a failed workspace migration build: the full per-metadata-kind failure report
export type WorkspaceMigrationOrchestratorFailedResult = {
  status: 'fail';
  report: OrchestratorFailureReport;
};

// Result of a successful workspace migration build: the ordered, ready-to-run WorkspaceMigration
export type WorkspaceMigrationOrchestratorSuccessfulResult = {
  status: 'success';
  workspaceMigration: WorkspaceMigration;
};
