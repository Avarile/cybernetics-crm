import { isDefined } from 'twenty-shared/utils';
import { type FullNameMetadata } from 'twenty-shared/types';

// Joins the defined parts of a full name (first/last/etc.) into a single display string.
export const computeDisplayName = (
  name: FullNameMetadata | null | undefined,
) => {
  if (!name) {
    return '';
  }

  return Object.values(name).filter(isDefined).join(' ');
};
