// Method decorator for subscribing to a custom (non-CRUD) workspace
// batch event, thinly wrapping NestJS's OnEvent with a typed event name.
import { OnEvent } from '@nestjs/event-emitter';

import { type CustomEventName } from 'src/engine/workspace-event-emitter/types/custom-event-name.type';

// Subscribes the decorated method to the given custom batch event.
export function OnCustomBatchEvent(event: CustomEventName): MethodDecorator {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    OnEvent(event)(target, propertyKey, descriptor);
  };
}
