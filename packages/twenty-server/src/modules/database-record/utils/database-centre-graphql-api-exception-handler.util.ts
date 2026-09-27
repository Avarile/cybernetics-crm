import { assertUnreachable } from 'twenty-shared/utils';

import {
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UserInputError,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';

// Maps a DatabaseCentreException code to the matching GraphQL error type.
// An upstream 401 deliberately maps to ForbiddenError, not AuthenticationError:
// a bad data-centre token must not look like an expired CRM session.
export const databaseCentreGraphqlApiExceptionHandler = (error: Error) => {
  if (error instanceof DatabaseCentreException) {
    switch (error.code) {
      case DatabaseCentreExceptionCode.CONNECTION_NOT_CONFIGURED:
      case DatabaseCentreExceptionCode.CONNECTION_DISABLED:
      case DatabaseCentreExceptionCode.INVALID_BASE_URL:
      case DatabaseCentreExceptionCode.TOKEN_DECRYPTION_FAILED:
      case DatabaseCentreExceptionCode.UPSTREAM_BAD_REQUEST:
      case DatabaseCentreExceptionCode.UPSTREAM_RATE_LIMITED:
      case DatabaseCentreExceptionCode.TARGET_OBJECT_NOT_SUPPORTED:
      case DatabaseCentreExceptionCode.ATTACHMENT_LIMIT_REACHED:
        throw new UserInputError(error);
      case DatabaseCentreExceptionCode.UPSTREAM_UNAUTHORIZED:
      case DatabaseCentreExceptionCode.UPSTREAM_FORBIDDEN:
        throw new ForbiddenError(error);
      case DatabaseCentreExceptionCode.UPSTREAM_NOT_FOUND:
      case DatabaseCentreExceptionCode.TARGET_RECORD_NOT_FOUND:
      case DatabaseCentreExceptionCode.DATABASE_RECORD_TARGET_NOT_FOUND:
        throw new NotFoundError(error);
      case DatabaseCentreExceptionCode.ALREADY_ATTACHED:
        throw new ConflictError(error);
      case DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE:
        throw new InternalServerError(error);
      default: {
        return assertUnreachable(error.code);
      }
    }
  }

  throw error;
};
