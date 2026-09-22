// GraphQL Yoga plugin that blocks schema introspection and "did you mean"
// suggestions in error messages for unauthenticated requests in production,
// to avoid leaking schema details to anonymous callers.
import { type Plugin } from 'graphql-yoga';
import { NoSchemaIntrospectionCustomRule } from 'graphql/validation/rules/custom/NoSchemaIntrospectionCustomRule';
import { isDefined } from 'twenty-shared/utils';

import { type GraphQLContext } from 'src/engine/api/graphql/graphql-config/graphql-config.service';
import { removeSuggestionInErrorsRule } from 'src/engine/core-modules/graphql/rules/remove-suggestion-in-errors.rule';

export const useDisableIntrospectionAndSuggestionsForUnauthenticatedUsers = (
  isProductionEnvironment: boolean,
): Plugin<GraphQLContext> => ({
  onValidate: ({ context, addValidationRule }) => {
    const isAuthenticated = isDefined(context.req.workspace);

    if (!isAuthenticated && isProductionEnvironment) {
      addValidationRule(NoSchemaIntrospectionCustomRule);
      addValidationRule(removeSuggestionInErrorsRule);
    }
  },
});
