// The possible shapes a resolved GraphQL field value can take before
// post-processing by a query-result-getter handler.
import { type ObjectRecord } from 'twenty-shared/types';

import { type IConnection } from 'src/engine/api/graphql/workspace-query-runner/interfaces/connection.interface';

export type QueryResultFieldValue =
  | IConnection<ObjectRecord>
  | IConnection<ObjectRecord>[]
  | { records: ObjectRecord[] }
  | ObjectRecord
  | ObjectRecord[];
