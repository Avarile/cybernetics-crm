/* @license Enterprise */

import { Field, ObjectType } from '@nestjs/graphql';

import { RowLevelPermissionPredicateGroupDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate-group.dto';
import { RowLevelPermissionPredicateDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate.dto';

// GraphQL result returned after upserting a role/object's row-level
// permission predicates and predicate groups.
@ObjectType('UpsertRowLevelPermissionPredicatesResult')
export class UpsertRowLevelPermissionPredicatesResultDTO {
  @Field(() => [RowLevelPermissionPredicateDTO])
  predicates: RowLevelPermissionPredicateDTO[];

  @Field(() => [RowLevelPermissionPredicateGroupDTO])
  predicateGroups: RowLevelPermissionPredicateGroupDTO[];
}
