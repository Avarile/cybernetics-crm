import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';

import { type Observable, catchError } from 'rxjs';

import { aiGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/ai/utils/ai-graphql-api-exception-handler.util';

// GraphQL interceptor routing AiException (and BillingException) instances
// through the shared AI GraphQL error mapping.
@Injectable()
export class AiGraphqlApiExceptionInterceptor implements NestInterceptor {
  // Pipes errors from the handler through aiGraphqlApiExceptionHandler.
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(catchError(aiGraphqlApiExceptionHandler));
  }
}
