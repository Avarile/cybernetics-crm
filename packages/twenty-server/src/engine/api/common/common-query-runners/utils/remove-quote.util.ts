const removeQuotes = (string: string): string => {
  return string.replace(/["']/g, '');
};

// Turns a quoted "table"."column" reference into a bare SQL alias
// (table_column), safe to use as a SELECT column alias.
export const formatColumnNameAsAlias = (
  columnNameWithQuotes: string,
): string => {
  return removeQuotes(columnNameWithQuotes).replace(/\./g, '_');
};
