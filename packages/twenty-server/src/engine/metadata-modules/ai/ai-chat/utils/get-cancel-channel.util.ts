// Redis pub/sub channel name used to signal cancellation of a specific chat stream.
export const getCancelChannel = (threadId: string, streamId: string) =>
  `ai-stream:cancel:${threadId}:${streamId}`;
