// Method decorator for subscribing to a batch database mutation event
// (e.g. "person.created") emitted by the query runner after a CRUD
// resolver executes, built from an object name and action.
import { OnEvent } from '@nestjs/event-emitter';

import { type DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';

// Subscribes the decorated method to the "<object>.<action>" event.
export function OnDatabaseBatchEvent(
  object: string,
  action: DatabaseEventAction,
): MethodDecorator {
  const event = `${object}.${action}`;

  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    OnEvent(event)(target, propertyKey, descriptor);
  };
}
