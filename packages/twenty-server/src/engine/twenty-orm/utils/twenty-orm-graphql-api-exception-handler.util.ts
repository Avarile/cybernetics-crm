import { isDefined } from 'twenty-shared/utils';

import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  type TwentyORMException,
  TwentyORMExceptionCode,
} from 'src/engine/twenty-orm/exceptions/twenty-orm.exception';

interface DuplicateKeyErrorWithMetadata extends TwentyORMException {
  conflictingRecordId?: string;
  conflictingObjectNameSingular?: string;
}

// Only this allowlist of error codes is converted into a GraphQL UserInputError with a
// user-friendly message; every other TwentyORMException code is rethrown as-is and
// handled upstream as an unexpected/internal error, since it hasn't been vetted as safe
// to describe to the client.
export const twentyORMGraphqlApiExceptionHandler = (
  error: TwentyORMException,
) => {
  switch (error.code) {
    case TwentyORMExceptionCode.DUPLICATE_ENTRY_DETECTED: {
      const duplicateKeyError: DuplicateKeyErrorWithMetadata = error;

      const extensions: Record<string, unknown> = {
        userFriendlyMessage: error.userFriendlyMessage,
        ...(isDefined(duplicateKeyError.conflictingRecordId) &&
        isDefined(duplicateKeyError.conflictingObjectNameSingular)
          ? {
              conflictingRecordId: duplicateKeyError.conflictingRecordId,
              conflictingObjectNameSingular:
                duplicateKeyError.conflictingObjectNameSingular,
            }
          : {}),
      };

      throw new UserInputError(error.message, extensions);
    }

    case TwentyORMExceptionCode.INVALID_INPUT:
    case TwentyORMExceptionCode.CONNECT_RECORD_NOT_FOUND:
    case TwentyORMExceptionCode.CONNECT_NOT_ALLOWED:
    case TwentyORMExceptionCode.CONNECT_UNIQUE_CONSTRAINT_ERROR:
    case TwentyORMExceptionCode.RLS_VALIDATION_FAILED:
    case TwentyORMExceptionCode.TOO_MANY_RECORDS_TO_UPDATE:
      throw new UserInputError(error.message, {
        userFriendlyMessage: error.userFriendlyMessage,
      });
    default: {
      throw error;
    }
  }
};
