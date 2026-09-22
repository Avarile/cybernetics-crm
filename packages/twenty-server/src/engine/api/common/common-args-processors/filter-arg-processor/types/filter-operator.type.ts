// Union of all comparison operators usable in an ObjectRecordFilter.
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'is'
  | 'like'
  | 'ilike'
  | 'startsWith'
  | 'endsWith'
  | 'containsAny'
  | 'containsIlike'
  | 'isEmptyArray'
  | 'search';
