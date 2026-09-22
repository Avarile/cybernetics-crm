// Converts an arbitrary caught Error into a translated BaseGraphQLError
// suitable for inclusion in a GraphQL response.
import { HttpException } from '@nestjs/common';

import { type I18n, type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import {
  BaseGraphQLError,
  ErrorCode,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { convertExceptionToGraphQLError } from 'src/engine/utils/global-exception-handler.util';

// Wraps HttpException instances via the standard exception-to-GraphQL-error
// conversion, or falls back to a generic internal server error, then
// translates the user-friendly message into the given locale.
export const generateGraphQLErrorFromError = (error: Error, i18n: I18n) => {
  const graphqlError =
    error instanceof HttpException
      ? convertExceptionToGraphQLError(error)
      : new BaseGraphQLError(error.message, ErrorCode.INTERNAL_SERVER_ERROR);

  const defaultErrorMessage = msg`An error occurred.`;

  const userFriendlyMessage =
    'userFriendlyMessage' in error
      ? (error.userFriendlyMessage as MessageDescriptor)
      : undefined;

  graphqlError.extensions.userFriendlyMessage = i18n._(
    userFriendlyMessage ?? defaultErrorMessage,
  );

  return graphqlError;
};
