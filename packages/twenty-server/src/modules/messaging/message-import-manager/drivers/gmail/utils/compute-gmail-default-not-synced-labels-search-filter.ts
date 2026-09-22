const CATEGORY_PREFIX = 'CATEGORY_';

// Builds a Gmail search exclusion term for a label id, using `-category:`
// syntax for CATEGORY_* labels and `-label:` for everything else.
export const computeGmailDefaultNotSyncedLabelsSearchFilter = (
  labelId: string,
): string => {
  if (labelId.startsWith(CATEGORY_PREFIX)) {
    const category = labelId.slice(CATEGORY_PREFIX.length).toLowerCase();

    return `-category:${category}`;
  }

  return `-label:${labelId.toLowerCase()}`;
};
