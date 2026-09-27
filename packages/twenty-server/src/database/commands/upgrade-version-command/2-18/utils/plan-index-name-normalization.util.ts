export type FlatIndexNameStatus = {
  indexMetadataId: string;
  objectMetadataId: string;
  currentName: string;
  expectedName: string;
};

export type RenameIndexNameOperation = {
  type: 'rename';
  indexMetadataId: string;
  objectMetadataId: string;
  fromName: string;
  toName: string;
};

export type DropRedundantIndexOperation = {
  type: 'dropRedundant';
  indexMetadataId: string;
  objectMetadataId: string;
  redundantName: string;
  keptName: string;
};

export type IndexNameNormalizationOperation =
  | RenameIndexNameOperation
  | DropRedundantIndexOperation;

// Legacy (pre-v2) index names weren't deterministic, so distinct index metadata rows
// can recompute to the same expected name here. Group by expected name and keep one
// "survivor" per group (renaming it if needed); every other row in the group is a
// redundant duplicate and gets dropped instead of also renamed to a name already taken.
export const planIndexNameNormalization = (
  indexStatuses: FlatIndexNameStatus[],
): IndexNameNormalizationOperation[] => {
  const operations: IndexNameNormalizationOperation[] = [];

  const statusesByExpectedName = new Map<string, FlatIndexNameStatus[]>();

  for (const status of indexStatuses) {
    const group = statusesByExpectedName.get(status.expectedName) ?? [];

    group.push(status);
    statusesByExpectedName.set(status.expectedName, group);
  }

  for (const [expectedName, group] of statusesByExpectedName) {
    const survivor =
      group.find((status) => status.currentName === expectedName) ?? group[0];

    if (survivor.currentName !== expectedName) {
      operations.push({
        type: 'rename',
        indexMetadataId: survivor.indexMetadataId,
        objectMetadataId: survivor.objectMetadataId,
        fromName: survivor.currentName,
        toName: expectedName,
      });
    }

    for (const status of group) {
      if (status.indexMetadataId === survivor.indexMetadataId) {
        continue;
      }

      operations.push({
        type: 'dropRedundant',
        indexMetadataId: status.indexMetadataId,
        objectMetadataId: status.objectMetadataId,
        redundantName: status.currentName,
        keptName: expectedName,
      });
    }
  }

  return operations;
};
