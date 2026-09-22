import { type ObjectRecord } from 'twenty-shared/types';

import { type CommonFindDuplicatesOutputItem } from 'src/engine/api/common/types/common-find-duplicates-output-item.type';
import { type CommonFindManyOutput } from 'src/engine/api/common/types/common-find-many-output.type';
import { type CommonGroupByOutputItem } from 'src/engine/api/common/types/common-group-by-output-item.type';
import {
  CommonExtendedInput,
  CommonQueryArgs,
} from 'src/engine/api/common/types/common-query-args.type';

// Union of every shape a common query-runner operation can return.
export type CommonQueryResult =
  | ObjectRecord[]
  | ObjectRecord
  | CommonGroupByOutputItem[]
  | CommonFindManyOutput
  | CommonFindDuplicatesOutputItem[];

// Pairs an operation's result with the fully-processed args that produced
// it, as returned by CommonBaseQueryRunnerService.execute.
export type CommonQueryExecutionResult<
  Output extends CommonQueryResult,
  Args extends CommonQueryArgs,
> = {
  results: Output;
  args: CommonExtendedInput<Args>;
};
