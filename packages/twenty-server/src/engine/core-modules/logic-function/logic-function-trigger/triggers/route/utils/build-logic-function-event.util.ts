// Builders converting an incoming Express request into the LogicFunctionEvent
// payload passed to an HTTP-route-triggered function.
import { type RawBodyRequest } from '@nestjs/common';
import { type Request } from 'express';
import { type LogicFunctionEvent } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { isObject, isString } from '@sniptt/guards';

const normalizeHeaderValue = (
  headerValue: string | string[] | undefined,
): string | undefined =>
  Array.isArray(headerValue) ? headerValue.join(', ') : headerValue;

// Selects which request headers to forward to the function, either all or
// only the explicitly allow-listed ones.
export const filterRequestHeaders = ({
  requestHeaders,
  forwardedRequestHeaders,
  forwardAllHeaders = false,
}: {
  requestHeaders: Request['headers'];
  forwardedRequestHeaders: string[];
  forwardAllHeaders?: boolean;
}): Record<string, string | undefined> => {
  if (forwardAllHeaders) {
    const allHeaders: Record<string, string | undefined> = {};

    for (const [headerName, headerValue] of Object.entries(requestHeaders)) {
      if (headerValue === undefined) {
        continue;
      }

      allHeaders[headerName] = normalizeHeaderValue(headerValue);
    }

    return allHeaders;
  }

  const lowercaseForwardedHeaders = forwardedRequestHeaders.map((h) =>
    h.toLowerCase(),
  );

  const filteredHeaders: Record<string, string | undefined> = {};

  for (const headerName of lowercaseForwardedHeaders) {
    const headerValue = requestHeaders[headerName];

    if (headerValue !== undefined) {
      filteredHeaders[headerName] = normalizeHeaderValue(headerValue);
    }
  }

  return filteredHeaders;
};

// Returns the request's raw body as a UTF-8 string, if captured.
export const extractRawBody = (request: Request): string | undefined => {
  const rawBody = (request as RawBodyRequest<Request>).rawBody;

  if (!isDefined(rawBody)) {
    return undefined;
  }

  return rawBody.toString('utf-8');
};

// Normalizes the parsed request body to an object, best-effort parsing
// string/buffer bodies as JSON and falling back to a raw wrapper.
export const extractBody = (request: Request): object | null => {
  if (!isDefined(request.body)) {
    return null;
  }

  if (isObject(request.body) && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (isString(request.body)) {
    try {
      return JSON.parse(request.body);
    } catch {
      return { raw: request.body };
    }
  }

  if (Buffer.isBuffer(request.body)) {
    try {
      return JSON.parse(request.body.toString('utf-8'));
    } catch {
      return { raw: request.body.toString('utf-8') };
    }
  }

  return { raw: String(request.body) };
};

// Flattens Express query params into a string-only map.
export const normalizeQueryStringParameters = (
  query: Request['query'],
): Record<string, string | undefined> => {
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      const stringValues = value.filter(
        (v): v is string => typeof v === 'string',
      );

      normalized[key] = stringValues.join(',');
    } else if (typeof value === 'string') {
      normalized[key] = value;
    } else if (typeof value === 'object') {
      normalized[key] = JSON.stringify(value);
    }
  }

  return normalized;
};

// Flattens route path params into a string-only map.
export const normalizePathParameters = (
  pathParams: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> => {
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(pathParams)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      normalized[key] = value.join(',');
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
};

// Assembles the full LogicFunctionEvent payload from a request's headers,
// query/path params, body and context.
export const buildLogicFunctionEvent = ({
  request,
  pathParameters,
  forwardedRequestHeaders,
  forwardAllHeaders = false,
  userWorkspaceId,
}: {
  request: Request;
  pathParameters: Record<string, string | string[] | undefined>;
  forwardedRequestHeaders: string[];
  forwardAllHeaders?: boolean;
  userWorkspaceId: string | null;
}): LogicFunctionEvent => {
  const rawBody = extractRawBody(request);

  return {
    headers: filterRequestHeaders({
      requestHeaders: request.headers,
      forwardedRequestHeaders,
      forwardAllHeaders,
    }),
    queryStringParameters: normalizeQueryStringParameters(request.query),
    pathParameters: normalizePathParameters(pathParameters),
    body: extractBody(request),
    ...(isDefined(rawBody) ? { rawBody } : {}),
    isBase64Encoded: false,
    requestContext: {
      http: {
        method: request.method,
        path: request.path,
      },
    },
    userWorkspaceId,
  };
};
