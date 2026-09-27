import { GraphQLList, GraphQLNonNull, type GraphQLType } from 'graphql';

// Recurses `depth` times to build nested lists (e.g. [[String]] for depth 2),
// applying the same NonNull rule at every level, not just the innermost one.
export const wrapTypeInGraphQLList = <T extends GraphQLType = GraphQLType>(
  targetType: T,
  depth: number,
  nullable: boolean,
): GraphQLList<T> => {
  const targetTypeNonNull = nullable
    ? targetType
    : new GraphQLNonNull(targetType);

  if (depth === 0) {
    return targetType as GraphQLList<T>;
  }

  return wrapTypeInGraphQLList<T>(
    new GraphQLList(targetTypeNonNull) as unknown as T,
    depth - 1,
    nullable,
  );
};
