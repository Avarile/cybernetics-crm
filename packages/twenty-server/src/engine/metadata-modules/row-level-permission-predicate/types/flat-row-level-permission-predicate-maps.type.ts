/* @license Enterprise */

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatRowLevelPermissionPredicate } from 'src/engine/metadata-modules/row-level-permission-predicate/types/flat-row-level-permission-predicate.type';

// Lookup maps of all flat row-level permission predicates in a workspace,
// indexed by id and by universal identifier.
export type FlatRowLevelPermissionPredicateMaps =
  FlatEntityMaps<FlatRowLevelPermissionPredicate>;
