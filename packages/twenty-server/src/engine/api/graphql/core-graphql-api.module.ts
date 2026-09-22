// Module grouping the services that build each workspace's dynamic
// GraphQL schema (custom scalars, SDL generation, and resolvers) so
// they can be shared with whichever module drives the core GraphQL API.
import { Module } from '@nestjs/common';

import { ScalarsExplorerService } from 'src/engine/api/graphql/services/scalars-explorer.service';
import { WorkspaceGraphqlSchemaSDLModule } from 'src/engine/api/graphql/workspace-graphql-schema-sdl/workspace-graphql-schema-sdl.module';
import { WorkspaceResolverBuilderModule } from 'src/engine/api/graphql/workspace-resolver-builder/workspace-resolver-builder.module';

import { WorkspaceSchemaFactory } from './workspace-schema.factory';

// Wires up the pieces that build a per-workspace GraphQL schema (SDL
// generation + resolver generation) for the core (workspace records) API.
@Module({
  imports: [WorkspaceResolverBuilderModule, WorkspaceGraphqlSchemaSDLModule],
  providers: [WorkspaceSchemaFactory, ScalarsExplorerService],
  exports: [WorkspaceSchemaFactory],
})
export class CoreGraphQLApiModule {}
