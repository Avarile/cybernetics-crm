import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';

import { type Observable, catchError } from 'rxjs';

import { messageFolderGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/message-folder/utils/message-folder-graphql-api-exception-handler.util';

// Routes errors thrown by message-folder resolvers through the shared exception handler
// so domain exceptions map to the correct GraphQL error type.
@Injectable()
export class MessageFolderGraphqlApiExceptionInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(catchError(messageFolderGraphqlApiExceptionHandler));
  }
}
