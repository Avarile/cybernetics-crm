// Runs cross-entity validation (identifier field checks against the
// optimistic field metadata maps) for object metadata create/update actions
// reported by the workspace migration orchestrator.

import { isDefined } from 'twenty-shared/utils';

import { findFlatEntityByUniversalIdentifierOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier-or-throw.util';
import { findManyFlatEntityByUniversalIdentifierInUniversalFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-many-flat-entity-by-universal-identifier-in-universal-flat-entity-maps-or-throw.util';
import { validateFlatObjectMetadataIdentifiers } from 'src/engine/metadata-modules/flat-object-metadata/validators/utils/validate-flat-object-metadata-identifiers.util';
import {
  type OrchestratorActionsReport,
  type OrchestratorFailureReport,
} from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';
import { type AllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/all-universal-flat-entity-maps.type';
import { getEmptyFlatEntityValidationError } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/utils/get-flat-entity-validation-error.util';

type ValidateObjectMetadataSystemFieldsIntegrityArgs = {
  orchestratorActionsReport: Pick<
    OrchestratorActionsReport,
    'fieldMetadata' | 'objectMetadata'
  >;
  optimisticUniversalFlatMaps: Pick<
    AllUniversalFlatEntityMaps,
    'flatFieldMetadataMaps' | 'flatObjectMetadataMaps'
  >;
};
// For each created object, validates its label/image identifiers; for each
// updated object whose label identifier changed, revalidates identifiers
// too. Collects per-entity validation error reports.
export const validateObjectMetadataCrossEntity = ({
  optimisticUniversalFlatMaps,
  orchestratorActionsReport,
}: ValidateObjectMetadataSystemFieldsIntegrityArgs): Pick<
  OrchestratorFailureReport,
  'objectMetadata'
> => {
  const metadataValidationErrors: Pick<
    OrchestratorFailureReport,
    'objectMetadata'
  > = {
    objectMetadata: [],
  };

  const createdObjectMetadatas =
    findManyFlatEntityByUniversalIdentifierInUniversalFlatEntityMapsOrThrow({
      universalIdentifiers: orchestratorActionsReport.objectMetadata.create.map(
        (createObjectAction) =>
          createObjectAction.flatEntity.universalIdentifier,
      ),
      flatEntityMaps: optimisticUniversalFlatMaps.flatObjectMetadataMaps,
    });

  for (const universalFlatObjectMetadata of createdObjectMetadatas) {
    const createFailedFlatEntityValidations = getEmptyFlatEntityValidationError(
      {
        flatEntityMinimalInformation: {
          universalIdentifier: universalFlatObjectMetadata.universalIdentifier,
          namePlural: universalFlatObjectMetadata.namePlural,
          nameSingular: universalFlatObjectMetadata.nameSingular,
        },
        metadataName: 'objectMetadata',
        type: 'create',
      },
    );

    createFailedFlatEntityValidations.errors.push(
      ...validateFlatObjectMetadataIdentifiers({
        universalFlatObjectMetadata,
        universalFlatFieldMetadataMaps:
          optimisticUniversalFlatMaps.flatFieldMetadataMaps,
      }),
    );

    if (createFailedFlatEntityValidations.errors.length > 0) {
      metadataValidationErrors.objectMetadata.push(
        createFailedFlatEntityValidations,
      );
    }
  }

  for (const objectMetadataUpdate of orchestratorActionsReport.objectMetadata
    .update) {
    const updatedFlatObjectMetadata =
      findFlatEntityByUniversalIdentifierOrThrow({
        flatEntityMaps: optimisticUniversalFlatMaps.flatObjectMetadataMaps,
        universalIdentifier: objectMetadataUpdate.universalIdentifier,
      });

    const updateFailedFlatEntityValidations = getEmptyFlatEntityValidationError(
      {
        flatEntityMinimalInformation: {
          universalIdentifier: updatedFlatObjectMetadata.universalIdentifier,
          namePlural: updatedFlatObjectMetadata.namePlural,
          nameSingular: updatedFlatObjectMetadata.nameSingular,
        },
        metadataName: 'objectMetadata',
        type: 'update',
      },
    );

    if (
      isDefined(
        objectMetadataUpdate.update
          .labelIdentifierFieldMetadataUniversalIdentifier,
      )
    ) {
      updateFailedFlatEntityValidations.errors.push(
        ...validateFlatObjectMetadataIdentifiers({
          universalFlatObjectMetadata: updatedFlatObjectMetadata,
          universalFlatFieldMetadataMaps:
            optimisticUniversalFlatMaps.flatFieldMetadataMaps,
        }),
      );
    }

    if (updateFailedFlatEntityValidations.errors.length > 0) {
      metadataValidationErrors.objectMetadata.push(
        updateFailedFlatEntityValidations,
      );
    }
  }

  return metadataValidationErrors;
};
