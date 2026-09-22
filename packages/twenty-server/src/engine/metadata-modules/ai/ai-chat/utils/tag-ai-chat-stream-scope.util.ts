import * as Sentry from '@sentry/node';

// Tags the current Sentry scope with chat stream identifiers so errors
// during a stream are correlated back to their thread/turn/workspace.
export const tagAiChatStreamScope = ({
  streamId,
  turnId,
  threadId,
  workspaceId,
}: {
  streamId: string;
  turnId?: string | null;
  threadId: string;
  workspaceId: string;
}) => {
  Sentry.getCurrentScope().setTags({
    streamId,
    turnId: turnId ?? undefined,
    threadId,
    workspaceId,
  });
};
