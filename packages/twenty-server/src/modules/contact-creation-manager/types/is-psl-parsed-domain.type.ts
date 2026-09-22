import { type ParsedDomain, type parse } from 'psl';
import { isDefined } from 'twenty-shared/utils';

// Narrows a `psl` parse result to the successful ParsedDomain shape.
export const isParsedDomain = (
  result: ReturnType<typeof parse>,
): result is ParsedDomain =>
  !isDefined(result.error) &&
  Object.prototype.hasOwnProperty.call(result, 'sld');
