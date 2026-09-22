import { Field, ObjectType } from '@nestjs/graphql';

import { MessageChannelDTO } from 'src/engine/metadata-modules/message-channel/dtos/message-channel.dto';

// Result of creating an email-group channel: the created channel plus the
// generated inbound forwarding address members should forward mail to.
@ObjectType('CreateEmailGroupChannelOutput')
export class CreateEmailGroupChannelOutput {
  @Field(() => MessageChannelDTO)
  messageChannel: MessageChannelDTO;

  @Field()
  forwardingAddress: string;
}
