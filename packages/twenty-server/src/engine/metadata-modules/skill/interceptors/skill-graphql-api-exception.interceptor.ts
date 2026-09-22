import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';

import { type Observable, catchError } from 'rxjs';

import { skillGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/skill/utils/skill-graphql-api-exception-handler.util';

// Routes errors thrown by skill resolvers through the shared exception handler so
// domain exceptions map to the correct GraphQL error type.
@Injectable()
export class SkillGraphqlApiExceptionInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(catchError(skillGraphqlApiExceptionHandler));
  }
}
