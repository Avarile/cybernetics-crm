import { Injectable, type NestMiddleware } from '@nestjs/common';

import { type NextFunction, type Request, type Response } from 'express';

import { MiddlewareService } from 'src/engine/middlewares/middleware.service';

// Express middleware run before the GraphQL endpoint: resolves the
// request's auth token into workspace/user context (or a default locale
// for unauthenticated requests), writing a GraphQL-shaped error response
// directly if that fails.
@Injectable()
export class GraphQLHydrateRequestFromTokenMiddleware implements NestMiddleware {
  constructor(private readonly middlewareService: MiddlewareService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      await this.middlewareService.hydrateGraphqlRequest(req);
    } catch (error) {
      this.middlewareService.writeGraphqlResponseOnExceptionCaught(res, error);

      return;
    }

    next();
  }
}
