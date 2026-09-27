import { isDefined } from 'twenty-shared/utils';

type AsyncIteratorLifecycleOptions<T> = {
  initialValue?: T;
  onHeartbeat?: () => Promise<boolean>;
  heartbeatIntervalMs?: number;
  onCleanup?: () => Promise<void>;
  onCleanupError?: (error: unknown) => void;
};

// GraphQL-js calls the subscription iterator's return() when the client disconnects
// (unsubscribes, closes the socket) — that's the only reliable hook for "this
// subscription ended", so cleanup (eg: destroying the event stream) is wired there
// rather than relying on the consumer to signal completion some other way.
export function wrapAsyncIteratorWithLifecycle<T>(
  iterator: AsyncIterableIterator<T>,
  options: AsyncIteratorLifecycleOptions<T>,
): AsyncIterableIterator<T> {
  const {
    initialValue,
    onHeartbeat,
    heartbeatIntervalMs,
    onCleanup,
    onCleanupError,
  } = options;
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let hasYieldedInitialValue = false;

  const startHeartbeat = () => {
    if (onHeartbeat && heartbeatIntervalMs) {
      heartbeatInterval = setInterval(() => {
        try {
          void onHeartbeat().catch(() => {});
        } catch {
          // Heartbeat failure shouldn't crash the stream
        }
      }, heartbeatIntervalMs);
    }
  };

  const cleanup = async () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    if (onCleanup) {
      try {
        await onCleanup();
      } catch (error) {
        onCleanupError?.(error);
      }
    }
  };

  return {
    next: async () => {
      // Started lazily on first pull rather than eagerly, so the heartbeat only
      // runs while something is actually consuming the iterator.
      if (!isDefined(heartbeatInterval)) {
        startHeartbeat();
      }

      // Yielded once before delegating to the real iterator so the GraphQL subscription
      // resolves immediately on subscribe, instead of the client waiting for the first
      // real event to confirm the connection is live.
      if (isDefined(initialValue) && !hasYieldedInitialValue) {
        hasYieldedInitialValue = true;

        return { done: false, value: initialValue };
      }

      let result: IteratorResult<T>;

      try {
        result = await iterator.next();
      } catch (error) {
        await cleanup();

        throw error;
      }

      if (result.done) {
        await cleanup();
      }

      return result;
    },
    return: async () => {
      let result: IteratorResult<T>;

      try {
        await cleanup();
      } finally {
        result = (await iterator.return?.()) ?? {
          done: true,
          value: undefined,
        };
      }

      return result;
    },
    throw: async (error) => {
      await cleanup();
      if (iterator.throw) {
        return iterator.throw(error);
      }
      throw error;
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}
