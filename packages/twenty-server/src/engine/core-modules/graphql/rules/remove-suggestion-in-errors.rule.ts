// GraphQL validation rule that strips "Did you mean X?" suggestions from
// validation error messages, used to avoid leaking schema field names to
// unauthenticated callers via typo suggestions.
import { type ASTVisitor, type ValidationContext } from 'graphql';

export const removeSuggestionInErrorsRule = (
  context: ValidationContext,
): ASTVisitor => {
  const originalReportError = context.reportError.bind(context);

  context.reportError = (error) => {
    error.message = error.message.replace(/ Did you mean[^?]*\?/g, '');
    originalReportError(error);
  };

  return {};
};
