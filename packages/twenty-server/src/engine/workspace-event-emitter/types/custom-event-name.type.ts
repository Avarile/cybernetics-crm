// Underscore-separated, unlike database event names (see computeEventName), which
// distinguishes custom events from the emitter's built-in CRUD event stream.
export type CustomEventName = `${string}_${string}`;
