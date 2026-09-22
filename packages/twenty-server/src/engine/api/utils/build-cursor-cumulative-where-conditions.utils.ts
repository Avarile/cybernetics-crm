import {
  type ObjectRecordCursorLeafCompositeValue,
  type ObjectRecordCursorLeafScalarValue,
  type ObjectRecordFilter,
} from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';

type BuildCursorConditionParams<CursorValue> = {
  cursorKey: string;
  cursorValue: CursorValue;
};

type ReturnType = Array<ObjectRecordFilter | { and: ObjectRecordFilter[] }>;

type CursorEntry<CursorValue> = Record<string, CursorValue>;

type BuildCursorCumulativeWhereConditionsParams<CursorValue> = {
  cursorEntries: CursorEntry<CursorValue>[];
  buildEqualityCondition: ({
    cursorKey,
    cursorValue,
  }: BuildCursorConditionParams<CursorValue>) => ObjectRecordFilter;
  buildMainCondition: ({
    cursorKey,
    cursorValue,
  }: BuildCursorConditionParams<CursorValue>) => ObjectRecordFilter;
};

// Builds the classic keyset-pagination OR-of-ANDs condition from ordered
// cursor entries: for each entry, ANDs an equality condition on every
// earlier cursor key with the direction-aware comparison on the current
// key, producing one alternative per cursor field.
export const buildCursorCumulativeWhereCondition = <
  CursorValue extends
    | ObjectRecordCursorLeafCompositeValue
    | ObjectRecordCursorLeafScalarValue,
>({
  cursorEntries,
  buildEqualityCondition,
  buildMainCondition,
}: BuildCursorCumulativeWhereConditionsParams<CursorValue>): ReturnType => {
  return cursorEntries.map((cursorEntry, index) => {
    const [currentCursorKey, currentCursorValue] =
      Object.entries(cursorEntry)[0];
    const andConditions: ObjectRecordFilter[] = [];

    for (
      let subConditionIndex = 0;
      subConditionIndex < index;
      subConditionIndex++
    ) {
      const previousCursorEntry = cursorEntries[subConditionIndex];
      const [previousCursorKey, previousCursorValue] =
        Object.entries(previousCursorEntry)[0];

      andConditions.push(
        buildEqualityCondition({
          cursorKey: previousCursorKey,
          cursorValue: previousCursorValue,
        }),
      );
    }

    andConditions.push(
      buildMainCondition({
        cursorKey: currentCursorKey,
        cursorValue: currentCursorValue,
      }),
    );

    if (andConditions.length === 1) {
      return andConditions[0];
    }

    return {
      and: andConditions,
    };
  });
};
