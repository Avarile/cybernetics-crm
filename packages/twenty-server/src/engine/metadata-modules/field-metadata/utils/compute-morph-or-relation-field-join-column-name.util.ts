type ComputeMorphOrRelationFieldJoinColumnNameArgs = {
  name: string;
};

// Computes the foreign key column name for a relation/morph-relation field.
export const computeMorphOrRelationFieldJoinColumnName = ({
  name,
}: ComputeMorphOrRelationFieldJoinColumnNameArgs): string => {
  return `${name}Id`;
};
