// Registers the shared EventLogTable enum with the GraphQL schema.

import { registerEnumType } from '@nestjs/graphql';

import { EventLogTable } from 'twenty-shared/types';

// Idempotently registers EventLogTable as a GraphQL enum named EventLogTable.
export const registerEventLogTableEnum = () => {
  registerEnumType(EventLogTable, {
    name: 'EventLogTable',
  });
};
