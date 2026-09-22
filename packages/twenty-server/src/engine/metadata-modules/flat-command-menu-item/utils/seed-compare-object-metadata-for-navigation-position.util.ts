// Sort comparator that orders custom objects before system objects when
// seeding default navigation command menu items.
export const seedCompareObjectMetadataForNavigationPosition = (
  a: { isSystem: boolean },
  b: { isSystem: boolean },
): number => {
  if (a.isSystem !== b.isSystem) {
    return a.isSystem ? 1 : -1;
  }

  return 0;
};
