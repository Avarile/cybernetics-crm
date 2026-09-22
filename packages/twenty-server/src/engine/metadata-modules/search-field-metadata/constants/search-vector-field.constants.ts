import { msg } from '@lingui/core/macro';

// Metadata for the system-generated TS_VECTOR field every searchable object gets, used
// to identify and label it consistently across the codebase.
export const SEARCH_VECTOR_FIELD = {
  name: 'searchVector',
  label: msg`Search vector`,
  description: msg`Field used for full-text search`,
} as const;
