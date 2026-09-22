import { extname } from 'node:path';

const ALLOWED_EXTENSIONS = new Set(['', '.ics', '.eml']);

// Filters out non-event hrefs (e.g. collection markers) some servers include
// in sync/PROPFIND responses; only .ics/.eml or extensionless hrefs are events.
export const isValidCalDavHref = (url: string): boolean =>
  ALLOWED_EXTENSIONS.has(extname(url).toLowerCase());
