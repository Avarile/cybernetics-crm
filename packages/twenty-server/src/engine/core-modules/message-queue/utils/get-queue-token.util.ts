// Builds the DI token used to inject a specific MessageQueueService
export const getQueueToken = (queueName: string) =>
  `MESSAGE_QUEUE_${queueName}`;
