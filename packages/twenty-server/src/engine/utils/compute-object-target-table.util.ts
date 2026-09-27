import { TWENTY_STANDARD_APPLICATION } from 'src/engine/workspace-manager/twenty-standard-application/constants/twenty-standard-applications';
import { type UniversalFlatObjectMetadata } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-object-metadata.type';

import { computeTableName } from './compute-table-name.util';

export const computeObjectTargetTable = (
  objectMetadata: Pick<
    UniversalFlatObjectMetadata,
    'nameSingular' | 'applicationUniversalIdentifier'
  >,
) => {
  // Anything not owned by the standard application (ie: a custom app's object) is
  // treated as custom and gets the underscore-prefixed table name.
  return computeTableName(
    objectMetadata.nameSingular,
    objectMetadata.applicationUniversalIdentifier !==
      TWENTY_STANDARD_APPLICATION.universalIdentifier,
  );
};
