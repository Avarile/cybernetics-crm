import { OrderByDirection } from 'twenty-shared/types';

import { type ObjectRecordOrderBy } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';

// Appends an ascending order-by-id tiebreaker unless the caller already
// ordered by id, ensuring stable pagination ordering.
export const addDefaultOrderById = (orderBy: ObjectRecordOrderBy) => {
  const hasIdOrder = orderBy.some((o) => Object.keys(o).includes('id'));

  return hasIdOrder
    ? orderBy
    : [...orderBy, { id: OrderByDirection.AscNullsFirst }];
};
