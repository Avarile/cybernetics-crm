import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

import { getRequest } from 'src/utils/extract-request';

// Injects the auth provider (e.g. google, microsoft, password) resolved
// onto the request.
export const AuthProvider = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = getRequest(ctx);

    return request.authProvider;
  },
);
