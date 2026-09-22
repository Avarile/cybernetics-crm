// Filter value shape for RELATION fields: an explicit list of selected
// record ids, optionally including "the current workspace member".
export type RelationFilterValue = {
  isCurrentWorkspaceMemberSelected?: boolean;
  selectedRecordIds: string[];
};

// Possible shapes of a view filter's value, depending on the filtered
// field's type and operand.
export type ViewFilterValue =
  | string
  | string[]
  | boolean
  | number
  | RelationFilterValue
  | Record<string, unknown>;
