import { type ObjectRecord } from 'twenty-shared/types';

import { type CommonPageInfo } from 'src/engine/api/common/types/common-page-info.type';
import { type CommonSelectedFieldsResult } from 'src/engine/api/common/types/common-selected-fields-result.type';

// Output of a findMany query: the page of records plus aggregate values,
// total count, pagination info, and the selected-fields metadata used to
// produce it.
export type CommonFindManyOutput = {
  records: ObjectRecord[];
  aggregatedValues: Record<string, number>;
  totalCount: number;
  pageInfo: CommonPageInfo;
  selectedFieldsResult: CommonSelectedFieldsResult;
};
