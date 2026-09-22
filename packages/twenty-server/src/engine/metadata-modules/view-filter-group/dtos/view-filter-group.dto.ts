import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ViewFilterGroupLogicalOperator } from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

registerEnumType(ViewFilterGroupLogicalOperator, {
  name: 'ViewFilterGroupLogicalOperator',
});

// GraphQL representation of a view filter group: a logical (AND/OR/NOT)
// node in a view's filter tree, optionally nested under a parent group.
@ObjectType('ViewFilterGroup')
export class ViewFilterGroupDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => UUIDScalarType, { nullable: true })
  parentViewFilterGroupId?: string | null;

  @Field(() => ViewFilterGroupLogicalOperator, {
    nullable: false,
    defaultValue: ViewFilterGroupLogicalOperator.NOT,
  })
  logicalOperator: ViewFilterGroupLogicalOperator;

  @Field(() => Number, { nullable: true })
  positionInViewFilterGroup?: number | null;

  @Field(() => UUIDScalarType, { nullable: false })
  viewId: string;

  @Field(() => UUIDScalarType, { nullable: false })
  workspaceId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date | null;
}
