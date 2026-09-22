// GraphQL representation of an error surfaced on a chat stream.
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ChatStreamError')
export class ChatStreamErrorDTO {
  @Field(() => String)
  code: string;

  @Field(() => String)
  message: string;
}
