import { Field, InputType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import { type RecordOrMetadataGqlOperationSignature } from 'src/engine/subscriptions/types/event-stream-data.type';

// Input for subscribing a GraphQL query (identified by queryId and its
// operation signature) to an event stream.
@InputType()
export class AddQuerySubscriptionInput {
  @Field()
  eventStreamId: string;

  @Field()
  queryId: string;

  @Field(() => GraphQLJSON)
  operationSignature: RecordOrMetadataGqlOperationSignature;
}
