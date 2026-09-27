import { type DeepPartial } from 'typeorm/common/DeepPartial';

import { type BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import {
  type ConnectObject,
  type DisconnectObject,
  type EntityRelationFields,
} from 'src/engine/twenty-orm/entity-manager/types/query-deep-partial-entity-with-nested-relation-fields.type';

// Lets a relation field accept either nested partial entity data (to create/update
// the related record inline) or a ConnectObject/DisconnectObject sentinel (to
// link/unlink an existing record by unique field), instead of only one or the other.
export type DeepPartialWithNestedRelationFields<T> = Omit<
  DeepPartial<T>,
  EntityRelationFields<T>
> & {
  [K in keyof T]?: T[K] extends BaseWorkspaceEntity | null
    ? DeepPartial<T[K]> | ConnectObject | DisconnectObject
    : DeepPartial<T[K]>;
};
