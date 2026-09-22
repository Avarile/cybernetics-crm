// GraphQL object type exposing an object's total record count.

import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ObjectRecordCount')
export class ObjectRecordCountDTO {
  @Field(() => String)
  objectNamePlural: string;

  @Field(() => Int)
  totalCount: number;
}
