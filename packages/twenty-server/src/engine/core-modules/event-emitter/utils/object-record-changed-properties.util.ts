// Computes which top-level property names differ between two record versions.
import { type ObjectRecord } from 'twenty-shared/types';
import { fastDeepEqual } from 'twenty-shared/utils';

import { type BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

// Returns the property names whose values differ (by deep equality) between
// an old and new version of a record, used to build change-event payloads.
export const objectRecordChangedProperties = <
  PRecord extends Partial<ObjectRecord | BaseWorkspaceEntity> =
    Partial<ObjectRecord>,
>(
  oldRecord: PRecord,
  newRecord: PRecord,
) => {
  const changedProperties = Object.keys(newRecord).filter(
    // @ts-expect-error legacy noImplicitAny
    (key) => !fastDeepEqual(oldRecord[key], newRecord[key]),
  );

  return changedProperties;
};
