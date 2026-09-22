// Picks the comparison operator ("gt"/"lt") for a cursor condition based
// on the field's sort direction and the pagination direction.
export const computeOperator = (
  isAscending: boolean,
  isForwardPagination: boolean,
): string => {
  return isAscending
    ? isForwardPagination
      ? 'gt'
      : 'lt'
    : isForwardPagination
      ? 'lt'
      : 'gt';
};
