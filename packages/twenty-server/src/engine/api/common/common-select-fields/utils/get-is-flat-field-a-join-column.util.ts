import { isDefined } from 'twenty-shared/utils';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';

// True when a field represents the "many" side of a junction-table
// relation (has junctionTargetFieldId), including the hard-coded
// noteTargets/taskTargets activity relations.
export const getIsFlatFieldAJoinColumn = ({
  flatField,
}: {
  flatField: FlatFieldMetadata;
}): boolean => {
  const flatFieldIsJoinColumn =
    isDefined(flatField.settings) &&
    'junctionTargetFieldId' in flatField.settings;

  // TODO: refactor this when we remove hard-coded activity relations
  const flatFieldIsActivityTarget =
    flatField.name === 'noteTargets' || flatField.name === 'taskTargets';

  return flatFieldIsJoinColumn || flatFieldIsActivityTarget;
};
