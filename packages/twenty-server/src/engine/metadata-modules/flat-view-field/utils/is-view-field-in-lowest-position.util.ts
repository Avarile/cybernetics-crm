import { type UniversalFlatViewField } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-view-field.type';

// Checks whether a view field's position is lower than all others given
// (or trivially true if there are no others), used to detect whether it
// sits first in its view/group.
export const isViewFieldInLowestPosition = ({
  flatViewField,
  otherFlatViewFields,
}: {
  otherFlatViewFields: UniversalFlatViewField[];
  flatViewField: UniversalFlatViewField;
}) => {
  if (otherFlatViewFields.length === 0) {
    return true;
  }
  const positions = otherFlatViewFields.map(({ position }) => position);
  const lowestPosition = Math.min(...positions);

  return flatViewField.position < lowestPosition;
};
