import { isNull } from '@sniptt/guards';

// Coerces a numeric field input (which may arrive as a string, e.g. from
// REST) into a number, passing null through unchanged.
export const transformNumericField = (
  value: number | string | null,
): number | null => {
  return isNull(value) ? null : Number(value);
};
