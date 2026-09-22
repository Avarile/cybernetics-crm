import { Field, ObjectType } from '@nestjs/graphql';

import { AdminChatMessageDTO } from 'src/engine/core-modules/admin-panel/dtos/admin-chat-message.dto';
import { AdminWorkspaceChatThreadDTO } from 'src/engine/core-modules/admin-panel/dtos/admin-workspace-chat-thread.dto';

// Pairs an admin chat thread with its full list of messages
@ObjectType('AdminChatThreadMessages')
export class AdminChatThreadMessagesDTO {
  @Field(() => AdminWorkspaceChatThreadDTO)
  thread: AdminWorkspaceChatThreadDTO;

  @Field(() => [AdminChatMessageDTO])
  messages: AdminChatMessageDTO[];
}
