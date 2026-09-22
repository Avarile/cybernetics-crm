import { type ObjectRecord } from 'twenty-shared/types';

type AggregateValues = {
  [key: string]: string;
};

type GroupByDimensionValues = {
  groupByDimensionValues: string[];
};

type Records = {
  records?: ObjectRecord[];
};

// One row of a groupBy result: its dimension values, aggregate values
// keyed by field, and an optional sample of the group's records.
export type CommonGroupByOutputItem = GroupByDimensionValues &
  AggregateValues &
  Records;
