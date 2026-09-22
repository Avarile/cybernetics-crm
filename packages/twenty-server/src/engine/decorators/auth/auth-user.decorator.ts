import {
  type ExecutionContext,
  ForbiddenException,
  createParamDecorator,
} from '@nestjs/common';

import { getRequest } from 'src/utils/extract-request';

interface DecoratorOptions {
  allowUndefined?: boolean;
}

// Injects the authenticated user from the request, throwing unless
// `allowUndefined` is passed (since API-key-only requests have no user).
export const AuthUser = createParamDecorator(
  (options: DecoratorOptions | undefined, ctx: ExecutionContext) => {
    const request = getRequest(ctx);

    if (!options?.allowUndefined && !request.user) {
      throw new ForbiddenException(
        "You're not authorized to do this. " +
          "Note: This endpoint requires a user and won't work with just an API key.",
      );
    }

    return request.user;
  },
);
