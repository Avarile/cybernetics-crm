import { Field, ObjectType } from '@nestjs/graphql';

// A single part of a chat message (text content or a tool call) for streaming/rendering
@ObjectType('AdminChatMessagePart')
export class AdminChatMessagePartDTO {
  @Field(() => String)
  type: string;

  @Field(() => String, { nullable: true })
  textContent: string | null;

  @Field(() => String, { nullable: true })
  toolName: string | null;
}
