import { OrderByDirection } from 'twenty-shared/types';

// True for either ascending OrderByDirection variant.
export const isAscendingOrder = (direction: OrderByDirection): boolean =>
  direction === OrderByDirection.AscNullsFirst ||
  direction === OrderByDirection.AscNullsLast;
