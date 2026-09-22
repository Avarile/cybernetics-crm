// Intercepts navigation menu item resolver errors and maps them to GraphQL
// API errors via the shared exception handler.

import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';

import { type Observable, catchError } from 'rxjs';

import { navigationMenuItemGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/navigation-menu-item/utils/navigation-menu-item-graphql-api-exception-handler.util';

@Injectable()
export class NavigationMenuItemGraphqlApiExceptionInterceptor implements NestInterceptor {
  // Routes any error from the handler chain through the exception mapper.
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(catchError(navigationMenuItemGraphqlApiExceptionHandler));
  }
}
