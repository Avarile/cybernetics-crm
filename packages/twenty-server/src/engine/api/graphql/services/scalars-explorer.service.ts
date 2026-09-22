import { Injectable } from '@nestjs/common';

import {
  type GraphQLScalarType,
  type GraphQLSchema,
  isScalarType,
} from 'graphql';

import { scalars } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// Looks up custom scalar (e.g. DateTime, UUID) implementations by name, and
// finds which custom scalars are actually referenced by a built schema.
@Injectable()
export class ScalarsExplorerService {
  private scalarImplementations: Record<string, GraphQLScalarType>;

  constructor() {
    this.scalarImplementations = scalars.reduce((acc, scalar) => {
      // @ts-expect-error legacy noImplicitAny
      acc[scalar.name] = scalar;

      return acc;
    }, {});
  }

  // Returns the GraphQLScalarType implementation for a scalar name, if any.
  getScalarImplementation(scalarName: string): GraphQLScalarType | undefined {
    return this.scalarImplementations[scalarName];
  }

  // Scans a schema's type map for custom (non-introspection) scalar types
  // in use, so only those need resolvers wired up.
  getUsedScalarNames(schema: GraphQLSchema): string[] {
    const typeMap = schema.getTypeMap();
    const usedScalarNames: string[] = [];

    for (const typeName in typeMap) {
      const type = typeMap[typeName];

      if (isScalarType(type) && !typeName.startsWith('__')) {
        usedScalarNames.push(type.name);
      }
    }

    return usedScalarNames;
  }

  // Builds the {scalarName: implementation} resolver map for the given
  // scalar names, dropping any without a known implementation.
  getScalarResolvers(
    usedScalarNames: string[],
  ): Record<string, GraphQLScalarType> {
    const scalarResolvers: Record<string, GraphQLScalarType> = {};

    for (const scalarName of usedScalarNames) {
      const scalarImplementation = this.getScalarImplementation(scalarName);

      if (scalarImplementation) {
        scalarResolvers[scalarName] = scalarImplementation;
      }
    }

    return scalarResolvers;
  }
}
