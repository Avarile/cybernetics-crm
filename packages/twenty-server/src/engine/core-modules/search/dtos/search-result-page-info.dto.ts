// GraphQL page info DTO for global search result pagination.
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('SearchResultPageInfo')
export class SearchResultPageInfoDTO {
  @Field(() => String, { nullable: true })
  endCursor: string | null;

  @Field(() => Boolean)
  hasNextPage: boolean;
}
