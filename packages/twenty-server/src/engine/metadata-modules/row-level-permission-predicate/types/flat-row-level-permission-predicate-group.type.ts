/* @license Enterprise */

import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type RowLevelPermissionPredicateGroupEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate-group.entity';

// Denormalized form of a row-level permission predicate group, with
// relation ids resolved to universal identifiers.
export type FlatRowLevelPermissionPredicateGroup =
  FlatEntityFrom<RowLevelPermissionPredicateGroupEntity>;
