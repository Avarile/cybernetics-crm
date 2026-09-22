import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';

import { type Observable, catchError } from 'rxjs';

import { calendarChannelGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/calendar-channel/utils/calendar-channel-graphql-api-exception-handler.util';

// Catches errors thrown from calendar channel resolvers and maps them to GraphQL-facing errors.
@Injectable()
export class CalendarChannelGraphqlApiExceptionInterceptor implements NestInterceptor {
  // Pipes the handler's error stream through the calendar channel exception handler.
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(catchError(calendarChannelGraphqlApiExceptionHandler));
  }
}
