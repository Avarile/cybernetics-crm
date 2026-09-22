import {
  type GroupByDateField,
  type GroupByField,
} from 'src/engine/api/common/common-query-runners/types/group-by-field.types';

// Type guard for a (non-relation) date groupBy field, distinguished by
// having a dateGranularity but not a nestedFieldMetadata.
export const isGroupByDateField = (
  groupByField: GroupByField,
): groupByField is GroupByDateField => {
  return (
    'dateGranularity' in groupByField &&
    !('nestedFieldMetadata' in groupByField)
  );
};
