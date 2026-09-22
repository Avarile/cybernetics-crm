/* @license Enterprise */

// Maps event-log exception codes to GraphQL ForbiddenError responses.
import { assertUnreachable } from 'twenty-shared/utils';

import {
  type EventLogsException,
  EventLogsExceptionCode,
} from 'src/engine/core-modules/event-logs/event-logs.exception';
import { ForbiddenError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';

// Converts a known EventLogsException code into a thrown GraphQL ForbiddenError.
export const eventLogsGraphqlApiExceptionHandler = (
  exception: EventLogsException,
) => {
  switch (exception.code) {
    case EventLogsExceptionCode.CLICKHOUSE_NOT_CONFIGURED:
    case EventLogsExceptionCode.NO_ENTITLEMENT:
      throw new ForbiddenError(exception);
    default: {
      assertUnreachable(exception.code);
    }
  }
};
