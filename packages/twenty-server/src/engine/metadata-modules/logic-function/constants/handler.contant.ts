// Default build/handler paths and naming rules used when a logic function's
// source doesn't override them.

export const DEFAULT_BUILT_HANDLER_PATH = 'src/index.mjs';
export const DEFAULT_SOURCE_HANDLER_PATH = 'src/index.ts';
export const DEFAULT_HANDLER_NAME = 'main';

// Matches a valid JS identifier or dotted member expression
// e.g. "main", "handler", "default.config.handler", "exports.run"
export const HANDLER_NAME_REGEX =
  /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/;
