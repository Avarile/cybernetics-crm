import { Inject } from '@nestjs/common';

import { type MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { getQueueToken } from 'src/engine/core-modules/message-queue/utils/get-queue-token.util';

// Parameter decorator that injects the message queue service bound to the given queue
export const InjectMessageQueue = (queueName: MessageQueue) => {
  return Inject(getQueueToken(queueName));
};
