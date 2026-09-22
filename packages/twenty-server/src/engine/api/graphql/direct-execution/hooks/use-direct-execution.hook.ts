// GraphQL Yoga request plugin that intercepts incoming requests before
// they hit the normal execution pipeline: if the query only touches
// workspace/introspection fields (not core/metadata fields), it is
// short-circuited through DirectExecutionService's faster path and the
// response is written directly, skipping standard schema execution.
import * as Sentry from '@sentry/node';
import { type Request } from 'express';
import { DocumentNode, parse } from 'graphql';
import { type Plugin } from 'graphql-yoga';

import { isNull } from '@sniptt/guards';
import { type DirectExecutionService } from 'src/engine/api/graphql/direct-execution/direct-execution.service';
import { classifyTopLevelFields } from 'src/engine/api/graphql/direct-execution/utils/classify-top-level-fields.util';
import { findOperationDefinition } from 'src/engine/api/graphql/direct-execution/utils/find-operation-definition.util';
import { isSubscriptionOperation } from 'src/engine/api/graphql/direct-execution/utils/is-subscription-operation.util';
import { type FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';

export type DirectExecutionPluginConfig = {
  directExecutionService: DirectExecutionService;
  featureFlagService: FeatureFlagService;
};

// Creates the Yoga plugin. On each request: parses the query, bails out
// early for subscriptions or queries mixing core and workspace fields
// (those must go through the normal pipeline / be split by the client),
// then delegates eligible workspace queries to direct execution and
// ends the response with its result.
export function useDirectExecution(
  config: DirectExecutionPluginConfig,
): Plugin {
  return {
    onRequest: async ({ endResponse, serverContext }) => {
      const req = (serverContext as unknown as { req: Request }).req;

      if (!req.workspace?.id || !req.body?.query) {
        return;
      }

      const queryString = req.body.query as string;
      const operationName = req.body.operationName as string | undefined;

      let document: DocumentNode;
      try {
        document = parse(queryString);
      } catch {
        return;
      }

      const operationDefinition = findOperationDefinition(
        document,
        operationName,
      );

      if (
        !operationDefinition ||
        isSubscriptionOperation(document, operationName)
      ) {
        return;
      }

      const workspaceResolverNames =
        await config.directExecutionService.getWorkspaceResolverNames(
          req.workspace.id,
        );

      if (!workspaceResolverNames) {
        return;
      }

      const { hasIntrospectionFields, hasWorkspaceFields, hasCoreFields } =
        classifyTopLevelFields(document, operationName, workspaceResolverNames);

      if (hasCoreFields && hasWorkspaceFields) {
        const error = new UserInputError(
          'This query cannot be executed as a single request. Please split it into separate queries.',
        );

        return endResponse(Response.json({ errors: [error.toJSON()] }));
      }

      if (hasCoreFields) {
        return;
      }

      if (Sentry.isInitialized()) {
        const transactionName =
          operationName || operationDefinition.name?.value || '';

        Sentry.setTags({
          operationName: transactionName,
          operation: operationDefinition.operation,
        });
        Sentry.getCurrentScope().setTransactionName(transactionName);
      }

      const result = await config.directExecutionService.execute(
        req,
        document,
        hasIntrospectionFields,
        hasWorkspaceFields,
      );

      if (isNull(result)) {
        return;
      }

      return endResponse(Response.json(result));
    },
  };
}
