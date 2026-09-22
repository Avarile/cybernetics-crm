import { type ObjectRecord } from 'twenty-shared/types';

// One source record's duplicate-search result: its matches plus pagination
// info for that match set.
export type CommonFindDuplicatesOutputItem = {
  records: ObjectRecord[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};
