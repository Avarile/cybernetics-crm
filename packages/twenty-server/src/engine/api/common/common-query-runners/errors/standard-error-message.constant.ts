import { msg } from '@lingui/core/macro';

// Generic user-facing fallback message for internal/unexpected errors that
// shouldn't leak implementation details.
export const STANDARD_ERROR_MESSAGE = msg`An error occurred.`;
