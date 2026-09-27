import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';

const throwInvalidBaseUrl = (reason: string): never => {
  throw new DatabaseCentreException(
    `Invalid data centre URL: ${reason}`,
    DatabaseCentreExceptionCode.INVALID_BASE_URL,
  );
};

// Normalizes a user-supplied data-centre origin: trims, strips trailing
// slashes and a trailing "/api" (the client appends it), and rejects
// credentials, query strings and fragments so they can't leak or smuggle
// parameters into every request.
export const normalizeDatabaseCentreBaseUrl = (value: string): string => {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return throwInvalidBaseUrl('URL is required');
  }

  let url: URL;

  try {
    url = new URL(trimmedValue);
  } catch {
    return throwInvalidBaseUrl('URL could not be parsed');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return throwInvalidBaseUrl('URL must start with http:// or https://');
  }

  if (url.username.length > 0 || url.password.length > 0) {
    return throwInvalidBaseUrl('URL must not contain credentials');
  }

  if (url.search.length > 0 || url.hash.length > 0) {
    return throwInvalidBaseUrl(
      'URL must not contain a query string or fragment',
    );
  }

  let path = url.pathname.replace(/\/+$/, '');

  if (path.endsWith('/api')) {
    path = path.slice(0, -'/api'.length);
  }

  return `${url.protocol}//${url.host}${path}`;
};
