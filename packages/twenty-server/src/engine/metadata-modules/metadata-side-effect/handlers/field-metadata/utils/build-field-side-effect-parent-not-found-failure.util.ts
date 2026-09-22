// Builds the standard failure result a field side effect handler returns
// when it can't resolve the field's parent object metadata.

import { msg, t } from '@lingui/core/macro';
import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';
import { type MetadataUniversalFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-universal-flat-entity.type';
import { type WorkspaceMigrationActionType } from 'src/engine/metadata-modules/flat-entity/types/metadata-workspace-migration-action.type';
import { MetadataSideEffectExceptionCode } from 'src/engine/metadata-modules/metadata-side-effect/exceptions/metadata-side-effect-exception-code';
import { type MetadataSideEffectFailure } from 'src/engine/metadata-modules/metadata-side-effect/types/metadata-side-effect-result.type';

// Formats a SIDE_EFFECT_PARENT_METADATA_NOT_FOUND failure for the given
// field and operation type.
export const buildFieldSideEffectParentNotFoundFailure = ({
  flatFieldMetadata,
  operation,
}: {
  flatFieldMetadata: MetadataUniversalFlatEntity<'fieldMetadata'>;
  operation: WorkspaceMigrationActionType;
}): MetadataSideEffectFailure => ({
  status: 'fail',
  type: operation,
  metadataName: 'fieldMetadata',
  flatEntityMinimalInformation: {
    universalIdentifier: flatFieldMetadata.universalIdentifier,
    name: flatFieldMetadata.name,
  } as Partial<MetadataFlatEntity<AllMetadataName>>,
  errors: [
    {
      code: MetadataSideEffectExceptionCode.SIDE_EFFECT_PARENT_METADATA_NOT_FOUND,
      message: t`Could not resolve parent object metadata "${flatFieldMetadata.objectMetadataUniversalIdentifier}" for field unique index side effect`,
      userFriendlyMessage: msg`This field references an object that could not be found`,
    },
  ],
});
