import { isDefined } from 'twenty-shared/utils';

import { type PreallocatedIdByUniversalIdentifierByMetadataName } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-universal-relation-identifiers-to-ids.util';
import { type AllUniversalWorkspaceMigrationAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-action-common';

// Only objectMetadata/fieldMetadata create actions can carry a pre-assigned id (set
// during the build phase — see BaseUniversalCreateWorkspaceMigrationAction's `id` and
// aggregateRelationFieldPairs' relatedFieldId). Collecting them here lets other actions
// in the same migration resolve a not-yet-inserted entity's universalIdentifier to its
// final id before the create action actually runs.
export const buildPreallocatedIdByUniversalIdentifierFromActions = (
  actions: AllUniversalWorkspaceMigrationAction[],
): PreallocatedIdByUniversalIdentifierByMetadataName => {
  const objectMetadata: Record<string, string> = {};
  const fieldMetadata: Record<string, string> = {};

  for (const action of actions) {
    if (action.type !== 'create') {
      continue;
    }

    if (action.metadataName === 'objectMetadata') {
      if (isDefined(action.id)) {
        objectMetadata[action.flatEntity.universalIdentifier] = action.id;
      }

      const fieldIdByUniversalIdentifier =
        action.fieldIdByUniversalIdentifier ?? {};

      for (const universalFlatFieldMetadata of action.universalFlatFieldMetadatas) {
        const fieldId =
          fieldIdByUniversalIdentifier[
            universalFlatFieldMetadata.universalIdentifier
          ];

        if (isDefined(fieldId)) {
          fieldMetadata[universalFlatFieldMetadata.universalIdentifier] =
            fieldId;
        }
      }

      continue;
    }

    if (action.metadataName === 'fieldMetadata') {
      if (isDefined(action.id)) {
        fieldMetadata[action.flatEntity.universalIdentifier] = action.id;
      }

      if (
        isDefined(action.relatedUniversalFlatFieldMetadata) &&
        isDefined(action.relatedFieldId)
      ) {
        fieldMetadata[
          action.relatedUniversalFlatFieldMetadata.universalIdentifier
        ] = action.relatedFieldId;
      }
    }
  }

  return { objectMetadata, fieldMetadata };
};
