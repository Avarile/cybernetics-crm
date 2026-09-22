import { type Request } from 'express';

// Minimal subset of an Express Request's fields needed by request parsers
// that must also work outside a real HTTP request (e.g. constructed
// synthetically for internal calls).
export type RequestContext = {
  headers: Request['headers'];
  baseUrl: string;
  path: Request['path'];
  body?: Request['body'];
  query?: Request['query'];
};
