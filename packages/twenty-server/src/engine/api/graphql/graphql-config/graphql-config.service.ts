// Builds the GraphQL Yoga driver config for the core ('workspace
// records') GraphQL API: registers the direct-execution fast path,
// error handling, introspection guarding, and query complexity limit
// plugins, then exposes GraphiQL only in development.
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { type GqlOptionsFactory } from '@nestjs/graphql';

import {
  type YogaDriverConfig,
  type YogaDriverServerContext,
} from '@graphql-yoga/nestjs';
import * as Sentry from '@sentry/node';
import GraphQLJSON from 'graphql-type-json';

import { NodeEnvironment } from 'src/engine/core-modules/twenty-config/interfaces/node-environment.interface';

import { DirectExecutionService } from 'src/engine/api/graphql/direct-execution/direct-execution.service';
import { useDirectExecution } from 'src/engine/api/graphql/direct-execution/hooks/use-direct-execution.hook';
import { type FlatAuthContextUser } from 'src/engine/core-modules/auth/types/flat-auth-context-user.type';
import { CoreEngineModule } from 'src/engine/core-modules/core-engine.module';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { useSentryTracing } from 'src/engine/core-modules/exception-handler/hooks/use-sentry-tracing';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { useDisableIntrospectionAndSuggestionsForUnauthenticatedUsers } from 'src/engine/core-modules/graphql/hooks/use-disable-introspection-and-suggestions-for-unauthenticated-users.hook';
import { useGraphQLErrorHandlerHook } from 'src/engine/core-modules/graphql/hooks/use-graphql-error-handler.hook';
import { useValidateGraphqlQueryComplexity } from 'src/engine/core-modules/graphql/hooks/use-validate-graphql-query-complexity.hook';
import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type FlatWorkspace } from 'src/engine/core-modules/workspace/types/flat-workspace.type';
import { DataloaderService } from 'src/engine/dataloaders/dataloader.service';
import { renderApolloPlayground } from 'src/engine/utils/render-apollo-playground.util';

// Request-scoped GraphQL context: the authenticated user and resolved
// workspace, made available to every resolver in the core API.
export interface GraphQLContext extends YogaDriverServerContext<'express'> {
  user?: FlatAuthContextUser;
  workspace?: FlatWorkspace;
}

// NestJS GqlOptionsFactory implementation that produces the Yoga driver
// options for the core GraphQL API at bootstrap time.
@Injectable()
export class GraphQLConfigService implements GqlOptionsFactory<
  YogaDriverConfig<'express'>
> {
  constructor(
    private readonly exceptionHandlerService: ExceptionHandlerService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly moduleRef: ModuleRef,
    private readonly metricsService: MetricsService,
    private readonly dataloaderService: DataloaderService,
    private readonly i18nService: I18nService,
    private readonly directExecutionService: DirectExecutionService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  // Assembles the Yoga plugin chain (direct execution, error handling,
  // introspection lockdown, complexity limits, optional Sentry tracing)
  // and the resulting driver config for the core GraphQL API.
  createGqlOptions(): YogaDriverConfig {
    const isDebugMode =
      this.twentyConfigService.get('NODE_ENV') === NodeEnvironment.DEVELOPMENT;
    const plugins = [
      useDirectExecution({
        directExecutionService: this.directExecutionService,
        featureFlagService: this.featureFlagService,
      }),
      useGraphQLErrorHandlerHook({
        metricsService: this.metricsService,
        exceptionHandlerService: this.exceptionHandlerService,
        i18nService: this.i18nService,
        twentyConfigService: this.twentyConfigService,
      }),
      useDisableIntrospectionAndSuggestionsForUnauthenticatedUsers(
        this.twentyConfigService.get('NODE_ENV') === NodeEnvironment.PRODUCTION,
      ),
      useValidateGraphqlQueryComplexity({
        maximumAllowedFields:
          this.twentyConfigService.get('GRAPHQL_MAX_FIELDS'),
        maximumAllowedRootResolvers: this.twentyConfigService.get(
          'GRAPHQL_MAX_ROOT_RESOLVERS',
        ),
        checkDuplicateRootResolvers: true,
      }),
    ];

    if (Sentry.isInitialized()) {
      plugins.push(useSentryTracing());
    }

    const config: YogaDriverConfig = {
      autoSchemaFile: true,
      include: [CoreEngineModule],
      resolverSchemaScope: 'core',
      buildSchemaOptions: {},
      resolvers: { JSON: GraphQLJSON },
      plugins: plugins,
      context: () => ({
        loaders: this.dataloaderService.createLoaders(),
      }),
    };

    if (isDebugMode) {
      config.renderGraphiQL = () => {
        return renderApolloPlayground();
      };
    }

    return config;
  }
}
