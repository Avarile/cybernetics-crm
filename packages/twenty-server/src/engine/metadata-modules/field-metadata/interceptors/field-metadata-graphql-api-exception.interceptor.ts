import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';

import { type Observable, catchError } from 'rxjs';

import { fieldMetadataGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/field-metadata/utils/field-metadata-graphql-api-exception-handler.util';

// GraphQL interceptor routing field metadata errors through the shared
// field-metadata GraphQL error mapping.
@Injectable()
export class FieldMetadataGraphqlApiExceptionInterceptor implements NestInterceptor {
  // Pipes errors from the handler through fieldMetadataGraphqlApiExceptionHandler.
  // oxlint-disable-next-line typescript/no-explicit-any
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(catchError((err) => fieldMetadataGraphqlApiExceptionHandler(err)));
  }
}
