import { type AllMetadataName } from 'twenty-shared/metadata';

import {
  type MetadataFlatWorkspaceMigrationAction,
  type MetadataUniversalWorkspaceMigrationAction,
  type WorkspaceMigrationActionType,
} from 'src/engine/metadata-modules/flat-entity/types/metadata-workspace-migration-action.type';

// "Universal" actions reference entities by their portable universalIdentifier (stable
// across workspaces/environments, e.g. when an application's metadata is defined once
// and installed into many workspaces). "Flat" actions reference the same entities by
// their real per-workspace database ID. The builder produces Universal actions; they're
// resolved to Flat actions (universalIdentifier -> id) before the runner executes them
// against an actual workspace schema.
export type AllUniversalWorkspaceMigrationAction<
  TActionType extends WorkspaceMigrationActionType =
    WorkspaceMigrationActionType,
  TMetadataName extends AllMetadataName = AllMetadataName,
> = MetadataUniversalWorkspaceMigrationAction<TMetadataName, TActionType>;

export type AllFlatWorkspaceMigrationAction<
  TActionType extends WorkspaceMigrationActionType =
    WorkspaceMigrationActionType,
  TMetadataName extends AllMetadataName = AllMetadataName,
> = MetadataFlatWorkspaceMigrationAction<TMetadataName, TActionType>;

export { WorkspaceMigrationActionType };

export type WorkspaceMigrationActionHandlerKey =
  `${WorkspaceMigrationActionType}_${AllMetadataName}`;

export const buildActionHandlerKey = (
  actionType: WorkspaceMigrationActionType,
  metadataName: AllMetadataName,
): WorkspaceMigrationActionHandlerKey => `${actionType}_${metadataName}`;
