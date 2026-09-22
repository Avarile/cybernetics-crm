import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  ViewGroupException,
  ViewGroupExceptionCode,
} from 'src/engine/metadata-modules/view-group/exceptions/view-group.exception';
import { viewGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/view/utils/view-graphql-api-exception-handler.util';

// Maps a ViewGroupException with the "missing group-by field" code to a
// user-input error; otherwise delegates to the shared view exception
// handler (which also covers WorkspaceMigrationBuilderException).
export const viewGroupGraphqlApiExceptionHandler = (error: Error) => {
  if (error instanceof ViewGroupException) {
    if (
      error.code ===
      ViewGroupExceptionCode.MISSING_MAIN_GROUP_BY_FIELD_METADATA_ID
    ) {
      throw new UserInputError(error.message, {
        userFriendlyMessage: error.userFriendlyMessage,
      });
    }
  }

  return viewGraphqlApiExceptionHandler(error);
};
