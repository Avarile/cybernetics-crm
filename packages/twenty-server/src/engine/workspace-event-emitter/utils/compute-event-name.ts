import { checkStringIsDatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/utils/check-string-is-database-event-action';

// Inverse of parseEventNameOrThrow — the '.' separator must stay in sync between the two.
export const computeEventName = (objectName: string, action: string) => {
  if (!checkStringIsDatabaseEventAction(action)) {
    throw new Error('Invalid action');
  }

  return `${objectName}.${action}`;
};
