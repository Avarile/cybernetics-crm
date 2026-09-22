import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';

// Type guard checking whether a string is a valid DatabaseEventAction value.
export const checkStringIsDatabaseEventAction = (
  value: string,
): value is DatabaseEventAction => {
  return Object.values(DatabaseEventAction).includes(
    value as DatabaseEventAction,
  );
};
