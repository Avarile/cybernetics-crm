import { type ObjectRecordGroupByDateGranularity } from 'twenty-shared/types';

// SQL-level description of one groupBy dimension: its GROUP BY expression,
// the column alias to select it under, and the date granularity if any.
export type GroupByDefinition = {
  columnNameWithQuotes: string;
  expression: string;
  alias: string;
  dateGranularity?: ObjectRecordGroupByDateGranularity;
};
