import { assertUnreachable } from 'twenty-shared/utils';

import {
  NotFoundError,
  UserInputError,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  CommandMenuItemException,
  CommandMenuItemExceptionCode,
} from 'src/engine/metadata-modules/command-menu-item/command-menu-item.exception';

// Maps a CommandMenuItemException to the matching GraphQL error type
// (not-found vs. user-input), rethrowing anything else unchanged.
export const commandMenuItemGraphqlApiExceptionHandler = (error: Error) => {
  if (error instanceof CommandMenuItemException) {
    switch (error.code) {
      case CommandMenuItemExceptionCode.COMMAND_MENU_ITEM_NOT_FOUND:
        throw new NotFoundError(error);
      case CommandMenuItemExceptionCode.INVALID_COMMAND_MENU_ITEM_INPUT:
      case CommandMenuItemExceptionCode.WORKFLOW_OR_FRONT_COMPONENT_REQUIRED:
      case CommandMenuItemExceptionCode.COMMAND_MENU_ITEM_CANNOT_BE_RESET:
        throw new UserInputError(error);
      default: {
        return assertUnreachable(error.code);
      }
    }
  }

  throw error;
};
