import { Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';

import { assertUnreachable } from 'twenty-shared/utils';

import { ForbiddenError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  EventStreamException,
  EventStreamExceptionCode,
} from 'src/engine/subscriptions/event-stream.exception';

@Catch(EventStreamException)
export class EventStreamExceptionFilter implements GqlExceptionFilter {
  catch(exception: EventStreamException) {
    switch (exception.code) {
      // ALREADY_EXISTS is thrown both when a reconnect's isAuthorized() check fails
      // (EventStreamResolver) and as a race-condition guard in EventStreamService — in
      // the caller-relevant case it's really an authz failure, hence sharing Forbidden
      // with NOT_AUTHORIZED rather than mapping to a Conflict-style error.
      case EventStreamExceptionCode.EVENT_STREAM_ALREADY_EXISTS:
      case EventStreamExceptionCode.NOT_AUTHORIZED:
        throw new ForbiddenError(exception.message, {
          subCode: exception.code,
          userFriendlyMessage: exception.userFriendlyMessage,
        });
      default: {
        throw assertUnreachable(exception.code);
      }
    }
  }
}
