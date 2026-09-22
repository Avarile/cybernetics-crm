import { type ObjectRecordDiff } from 'twenty-shared/database-events';

import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

// Checks whether a person's primary email differs before/after (case-insensitive).
export const hasPrimaryEmailChanged = (
  diff: Partial<ObjectRecordDiff<PersonWorkspaceEntity>>,
) => {
  const before = diff.emails?.before?.primaryEmail?.toLowerCase();
  const after = diff.emails?.after?.primaryEmail?.toLowerCase();

  return before !== after;
};
