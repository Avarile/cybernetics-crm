import { Module } from '@nestjs/common';

import { DATABASE_CONNECTION_GENERIC_API_BLOCKER_PRE_QUERY_HOOKS } from 'src/modules/database-record/query-hooks/database-connection-generic-api-blocker.pre-query.hooks';

// Registers the pre-query hooks that keep databaseConnection out of the
// generic record API.
@Module({
  providers: [...DATABASE_CONNECTION_GENERIC_API_BLOCKER_PRE_QUERY_HOOKS],
})
export class DatabaseRecordQueryHookModule {}
