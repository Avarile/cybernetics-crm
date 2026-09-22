// Marks a resolver class as belonging to the 'core' GraphQL schema scope
// (the workspace-record API), by tagging it with metadata read at
// schema-build time.
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Resolver } from '@nestjs/graphql';

import { RESOLVER_SCHEMA_SCOPE_KEY } from 'src/engine/api/graphql/graphql-config/constants/resolver-schema-scope-key.constant';
import { type ResolverSchemaScope } from 'src/engine/api/graphql/graphql-config/types/resolver-schema-scope.type';

export const CoreResolver = (typeFunc?: () => unknown) =>
  applyDecorators(
    typeFunc ? Resolver(typeFunc) : Resolver(),
    SetMetadata(RESOLVER_SCHEMA_SCOPE_KEY, 'core' as ResolverSchemaScope),
  );
