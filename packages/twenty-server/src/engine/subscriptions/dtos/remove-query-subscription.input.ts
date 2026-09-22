import { Field, InputType } from '@nestjs/graphql';

// Input for unsubscribing a GraphQL query from an event stream.
@InputType()
export class RemoveQueryFromEventStreamInput {
  @Field()
  eventStreamId: string;

  @Field()
  queryId: string;
}
