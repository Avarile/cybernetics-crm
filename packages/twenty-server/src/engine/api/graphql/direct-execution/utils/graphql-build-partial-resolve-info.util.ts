import {
  type FieldNode,
  type FragmentDefinitionNode,
  type GraphQLResolveInfo,
} from 'graphql';

// Direct execution never runs graphql-js's real executor, so there's no full
// GraphQLResolveInfo to hand off. This builds just enough of it (fieldNodes +
// fragments) for the `graphql-fields` package to compute the selection set.
export const graphQLBuildPartialResolveInfo = (
  field: FieldNode,
  fragmentMap: Map<string, FragmentDefinitionNode>,
): Pick<GraphQLResolveInfo, 'fieldNodes' | 'fragments'> => ({
  fieldNodes: [field],
  fragments: Object.fromEntries(fragmentMap),
});
