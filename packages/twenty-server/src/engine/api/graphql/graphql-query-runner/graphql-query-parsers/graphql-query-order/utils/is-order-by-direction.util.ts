import { isNonEmptyString } from '@sniptt/guards';
import { OrderByDirection } from 'twenty-shared/types';

// Type guard checking whether a value is one of the known OrderByDirection strings.
export const isOrderByDirection = (
  value: unknown,
): value is OrderByDirection => {
  return (
    isNonEmptyString(value) &&
    Object.values(OrderByDirection).includes(value as OrderByDirection)
  );
};
