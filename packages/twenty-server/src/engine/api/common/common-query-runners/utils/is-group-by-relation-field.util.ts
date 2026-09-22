import {
  type GroupByField,
  type GroupByRelationField,
} from 'src/engine/api/common/common-query-runners/types/group-by-field.types';

// Type guard for a groupBy field reached one hop through a relation.
export const isGroupByRelationField = (
  groupByField: GroupByField,
): groupByField is GroupByRelationField => {
  return 'nestedFieldMetadata' in groupByField;
};
