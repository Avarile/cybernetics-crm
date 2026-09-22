import { Field, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

// Field-level detail for a record event: which fields changed and the
// before/after/diff values.
@ObjectType('ObjectRecordEventProperties')
export class ObjectRecordEventPropertiesDTO {
  @Field(() => [String], { nullable: true })
  updatedFields?: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  before?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  after?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  diff?: object;
}
