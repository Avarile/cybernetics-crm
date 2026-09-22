// Converts a raw NestJS ForbiddenException into a GraphQL authentication error.
import {
  Catch,
  type ExceptionFilter,
  ForbiddenException,
} from '@nestjs/common';

import { msg } from '@lingui/core/macro';

import { AuthenticationError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';

@Catch(ForbiddenException)
export class ForbiddenExceptionGraphqlFilter implements ExceptionFilter {
  // Rethrows any ForbiddenException as a GraphQL AuthenticationError.
  catch(exception: ForbiddenException) {
    throw new AuthenticationError(exception.message, {
      userFriendlyMessage: msg`Authentication required.`,
    });
  }
}
