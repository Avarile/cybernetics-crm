// SQL ordering directive: useLower wraps the expression in LOWER() for
// case-insensitive sort, castToText casts enum-backed columns before that.
export type OrderByClause = {
  order: 'ASC' | 'DESC';
  nulls?: 'NULLS FIRST' | 'NULLS LAST';
  useLower?: boolean;
  castToText?: boolean; // For SELECT/MULTI_SELECT fields that need ::text before LOWER
};
