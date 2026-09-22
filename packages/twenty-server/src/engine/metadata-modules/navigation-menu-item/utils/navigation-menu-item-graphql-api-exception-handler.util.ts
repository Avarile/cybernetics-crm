// Maps each NavigationMenuItemExceptionCode to the appropriate GraphQL error
// type for the API layer.

import { assertUnreachable } from 'twenty-shared/utils';

import {
  NotFoundError,
  UserInputError,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  NavigationMenuItemException,
  NavigationMenuItemExceptionCode,
} from 'src/engine/metadata-modules/navigation-menu-item/navigation-menu-item.exception';

// Maps NOT_FOUND to a not-found error and the remaining codes to user
// input errors, rethrowing unrecognized errors unchanged.
export const navigationMenuItemGraphqlApiExceptionHandler = (error: Error) => {
  if (error instanceof NavigationMenuItemException) {
    switch (error.code) {
      case NavigationMenuItemExceptionCode.NAVIGATION_MENU_ITEM_NOT_FOUND:
        throw new NotFoundError(error);
      case NavigationMenuItemExceptionCode.INVALID_NAVIGATION_MENU_ITEM_INPUT:
      case NavigationMenuItemExceptionCode.CIRCULAR_DEPENDENCY:
      case NavigationMenuItemExceptionCode.MAX_DEPTH_EXCEEDED:
        throw new UserInputError(error);
      default: {
        return assertUnreachable(error.code);
      }
    }
  }

  throw error;
};
