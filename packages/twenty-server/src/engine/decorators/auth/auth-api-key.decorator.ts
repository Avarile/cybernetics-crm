import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { getRequest } from 'src/utils/extract-request';

// Injects the API key resolved onto the request by the auth guards
// (undefined for user-authenticated requests).
export const AuthApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = getRequest(ctx);

    return request.apiKey;
  },
);
