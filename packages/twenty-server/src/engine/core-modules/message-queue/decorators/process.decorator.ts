import { SetMetadata } from '@nestjs/common';

import { PROCESS_METADATA } from 'src/engine/core-modules/message-queue/message-queue.constants';

export interface MessageQueueProcessOptions {
  jobName: string;
}

// Marks a Processor class method as the handler for jobs with the given name
export function Process(jobName: string): MethodDecorator {
  return SetMetadata(PROCESS_METADATA, { jobName });
}
