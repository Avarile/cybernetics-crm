import { type GraphQLNamedType } from 'graphql';

// graphql-js requires every named type in a schema to be a single shared
// instance — generators check this registry before building a type (e.g. a
// composite/relation/enum type reused across many objects) and register what
// they create, so the same key never produces two different type instances.
export class GqlTypesStorage {
  private readonly gqlTypes = new Map<string, GraphQLNamedType>();

  addGqlType(key: string, type: GraphQLNamedType) {
    this.gqlTypes.set(key, type);
  }

  getGqlTypeByKey<T extends GraphQLNamedType = GraphQLNamedType>(
    key: string,
  ): T | undefined {
    return this.gqlTypes.get(key) as T | undefined;
  }

  getAllGqlTypesExcept(keysToExclude: string[]): GraphQLNamedType[] {
    return Array.from(this.gqlTypes.entries())
      .filter(([key]) => !keysToExclude.includes(key))
      .map(([, value]) => value);
  }
}
