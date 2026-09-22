import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

import { getRequest } from 'src/utils/extract-request';

// Injects the authenticated workspace member id resolved onto the request.
export const AuthWorkspaceMemberId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = getRequest(ctx);

    return request.workspaceMemberId;
  },
);
