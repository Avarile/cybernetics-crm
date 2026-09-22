/* @license Enterprise */

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatRowLevelPermissionPredicateGroup } from 'src/engine/metadata-modules/row-level-permission-predicate/types/flat-row-level-permission-predicate-group.type';

// Lookup maps of all flat row-level permission predicate groups in a
// workspace, indexed by id and by universal identifier.
export type FlatRowLevelPermissionPredicateGroupMaps =
  FlatEntityMaps<FlatRowLevelPermissionPredicateGroup>;
