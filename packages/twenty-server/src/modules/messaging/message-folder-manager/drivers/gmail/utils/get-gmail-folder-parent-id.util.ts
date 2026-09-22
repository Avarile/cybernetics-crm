// Resolves a nested label's parent label id by looking up the parent
// segment of its "Parent/Child" name in the label name-to-id map.
export const getGmailFolderParentId = (
  labelName: string,
  labelNameToIdMap: Map<string, string>,
): string | null => {
  if (!labelName.includes('/')) {
    return null;
  }
  const parentName = labelName.substring(0, labelName.lastIndexOf('/'));

  return labelNameToIdMap.get(parentName) || null;
};
