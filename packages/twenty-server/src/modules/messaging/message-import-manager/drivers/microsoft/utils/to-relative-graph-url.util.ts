import { isNonEmptyString } from '@sniptt/guards';

const GRAPH_VERSION_SEGMENTS = ['beta', 'v1.0'];

// Strips a Graph absolute URL's host and version segment (beta/v1.0),
// returning a relative path Graph's SDK client can call directly — used
// to normalize a stored delta link before resuming pagination from it.
export const toRelativeGraphUrl = (url: string): string => {
  if (!isNonEmptyString(url) || !url.startsWith('http')) {
    return url;
  }

  const parsedUrl = new URL(url);
  const pathSegments = parsedUrl.pathname.split('/').filter(isNonEmptyString);

  if (
    pathSegments.length > 0 &&
    GRAPH_VERSION_SEGMENTS.includes(pathSegments[0])
  ) {
    pathSegments.shift();
  }

  return `/${pathSegments.join('/')}${parsedUrl.search}`;
};
