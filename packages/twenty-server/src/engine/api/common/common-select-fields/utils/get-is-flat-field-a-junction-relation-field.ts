import { RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';

// True when a field is the many-to-one side pointing back out of a
// junction table, including the hard-coded note/task activity relations.
export const getIsFlatFieldAJunctionRelationField = ({
  flatField,
}: {
  flatField: FlatFieldMetadata;
}): boolean => {
  const isJunctionRelationField =
    isDefined(flatField.settings) &&
    'relationType' in flatField.settings &&
    flatField.settings.relationType === RelationType.MANY_TO_ONE;

  // TODO: refactor this when we remove hard-coded activity relations
  const isActivityRelationField =
    flatField.name === 'note' || flatField.name === 'task';

  return isJunctionRelationField || isActivityRelationField;
};
