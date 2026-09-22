import { registerEnumType } from '@nestjs/graphql';

// Determines the context in which a command menu item is offered:
// globally, only within an object's context, only for a record selection,
// or as a fallback when no other items match.
export enum CommandMenuItemAvailabilityType {
  GLOBAL = 'GLOBAL',
  GLOBAL_OBJECT_CONTEXT = 'GLOBAL_OBJECT_CONTEXT',
  RECORD_SELECTION = 'RECORD_SELECTION',
  FALLBACK = 'FALLBACK',
}

registerEnumType(CommandMenuItemAvailabilityType, {
  name: 'CommandMenuItemAvailabilityType',
});
