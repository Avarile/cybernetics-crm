// GraphQL result of sending a chat message: its id, whether it was queued
// for async processing, and the stream id to subscribe to for updates.
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('SendChatMessageResult')
export class SendChatMessageResultDTO {
  @Field(() => String)
  messageId: string;

  @Field(() => Boolean)
  queued: boolean;

  @Field(() => String, { nullable: true })
  streamId?: string;
}
