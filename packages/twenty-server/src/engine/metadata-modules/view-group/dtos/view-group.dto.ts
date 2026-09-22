import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// GraphQL representation of a view group: one distinct value bucket of a
// grouped view (e.g. a Kanban column), with its visibility and position.
@ObjectType('ViewGroup')
export class ViewGroupDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field({ nullable: false, defaultValue: true })
  isVisible: boolean;

  @Field({ nullable: false })
  fieldValue: string;

  @Field({ nullable: false, defaultValue: 0 })
  position: number;

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
