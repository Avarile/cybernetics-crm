import { v5 } from 'uuid';

// RFC 4122's predefined NAMESPACE_DNS UUID, reused here only as a fixed seed —
// unrelated to DNS. Any fixed namespace works; this one just avoids inventing a new one.
const EVENT_STREAM_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// v5 is deterministic: the same client-chosen eventStreamId always maps to the same
// channel id, so a client can resume the same channel across reconnects without the
// server needing to remember the mapping, while not using arbitrary client input directly
// as the cache/pubsub key.
export const eventStreamIdToChannelId = (eventStreamId: string): string => {
  return v5(eventStreamId, EVENT_STREAM_NAMESPACE);
};
