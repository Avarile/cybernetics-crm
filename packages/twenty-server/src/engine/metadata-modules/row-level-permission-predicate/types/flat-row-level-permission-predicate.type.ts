/* @license Enterprise */

import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type RowLevelPermissionPredicateEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate.entity';

// Denormalized form of a row-level permission predicate, with relation
// ids resolved to universal identifiers.
export type FlatRowLevelPermissionPredicate =
  FlatEntityFrom<RowLevelPermissionPredicateEntity>;
