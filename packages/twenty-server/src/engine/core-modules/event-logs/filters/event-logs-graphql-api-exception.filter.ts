/* @license Enterprise */

// Maps EventLogsException to a GraphQL-friendly error response.
import { Catch, type ExceptionFilter } from '@nestjs/common';

import { EventLogsException } from 'src/engine/core-modules/event-logs/event-logs.exception';
import { eventLogsGraphqlApiExceptionHandler } from 'src/engine/core-modules/event-logs/utils/event-logs-graphql-api-exception-handler.util';

@Catch(EventLogsException)
export class EventLogsGraphqlApiExceptionFilter implements ExceptionFilter {
  // Delegates to the shared event-logs GraphQL exception handler.
  catch(exception: EventLogsException) {
    return eventLogsGraphqlApiExceptionHandler(exception);
  }
}
