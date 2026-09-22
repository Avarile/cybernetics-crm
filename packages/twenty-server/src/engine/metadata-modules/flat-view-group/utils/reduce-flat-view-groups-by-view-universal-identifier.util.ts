import { isDefined } from 'twenty-shared/utils';

import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';

type FlatViewGroupsByViewUniversalIdentifier = {
  flatViewGroupRecordByViewUniversalIdentifier: Record<
    string,
    Record<string, FlatViewGroup>
  >;
  highestViewGroupPositionByViewUniversalIdentifier: Record<string, number>;
};

// Reduces a flat list of view groups into a per-view record keyed by group id, along
// with each view's highest existing group position (for computing the next position).
export const reduceFlatViewGroupsByViewUniversalIdentifier = ({
  flatViewGroups,
}: {
  flatViewGroups: FlatViewGroup[];
}): FlatViewGroupsByViewUniversalIdentifier => {
  const initialAccumulator: FlatViewGroupsByViewUniversalIdentifier = {
    flatViewGroupRecordByViewUniversalIdentifier: {},
    highestViewGroupPositionByViewUniversalIdentifier: {},
  };

  return flatViewGroups.reduce((accumulator, flatViewGroup) => {
    const accumulatorHighestPosition =
      accumulator.highestViewGroupPositionByViewUniversalIdentifier[
        flatViewGroup.viewUniversalIdentifier
      ];

    return {
      flatViewGroupRecordByViewUniversalIdentifier: {
        ...accumulator.flatViewGroupRecordByViewUniversalIdentifier,
        [flatViewGroup.viewUniversalIdentifier]: {
          ...accumulator.flatViewGroupRecordByViewUniversalIdentifier[
            flatViewGroup.viewUniversalIdentifier
          ],
          [flatViewGroup.id]: flatViewGroup,
        },
      },
      highestViewGroupPositionByViewUniversalIdentifier: {
        ...accumulator.highestViewGroupPositionByViewUniversalIdentifier,
        [flatViewGroup.viewUniversalIdentifier]: isDefined(
          accumulatorHighestPosition,
        )
          ? Math.max(accumulatorHighestPosition, flatViewGroup.position)
          : flatViewGroup.position,
      },
    };
  }, initialAccumulator);
};
