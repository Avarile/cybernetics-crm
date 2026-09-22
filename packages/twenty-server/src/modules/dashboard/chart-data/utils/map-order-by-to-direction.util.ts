import { OrderByDirection } from 'twenty-shared/types';
import { assertUnreachable } from 'twenty-shared/utils';

import { GraphOrderBy } from 'src/engine/metadata-modules/page-layout-widget/enums/graph-order-by.enum';

// Maps a GraphOrderBy value to the underlying record query's sort direction.
export const mapOrderByToDirection = (
  orderByEnum:
    | GraphOrderBy.FIELD_ASC
    | GraphOrderBy.FIELD_DESC
    | GraphOrderBy.VALUE_ASC
    | GraphOrderBy.VALUE_DESC,
): OrderByDirection => {
  switch (orderByEnum) {
    case GraphOrderBy.FIELD_ASC:
      return OrderByDirection.AscNullsLast;
    case GraphOrderBy.FIELD_DESC:
      return OrderByDirection.DescNullsLast;
    case GraphOrderBy.VALUE_ASC:
      return OrderByDirection.AscNullsLast;
    case GraphOrderBy.VALUE_DESC:
      return OrderByDirection.DescNullsLast;

    default:
      assertUnreachable(orderByEnum);
  }
};
