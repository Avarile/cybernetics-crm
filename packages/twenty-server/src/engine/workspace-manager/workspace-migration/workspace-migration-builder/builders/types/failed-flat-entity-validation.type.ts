import { type MessageDescriptor } from '@lingui/core';
import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';
import { type WorkspaceMigrationActionType } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';

export type FlatEntityValidationError<TCode extends string = string> = {
  code: TCode;
  // Developer-facing: logged, used in API/internal error responses.
  message: string;
  // End-user-facing i18n message shown in the UI when set; falls back to a generic
  // message derived from `code` otherwise (see getMetadataValidationUserFriendlyMessage).
  userFriendlyMessage?: MessageDescriptor;
  value?: unknown;
};

export type FailedFlatEntityValidation<
  TMetadataName extends AllMetadataName,
  TActionType extends WorkspaceMigrationActionType,
> = {
  type: TActionType;
  metadataName: TMetadataName;
  errors: FlatEntityValidationError[];
  flatEntityMinimalInformation: Partial<MetadataFlatEntity<TMetadataName>>;
};
