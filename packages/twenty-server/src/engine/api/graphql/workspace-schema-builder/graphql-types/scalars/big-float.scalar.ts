import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

export const BigFloatScalarType = new GraphQLScalarType({
  name: 'BigFloat',
  description:
    'A custom scalar type for representing big floating point numbers',
  // The DB layer sends NUMERIC values as strings specifically to avoid float
  // precision loss, but this converts back to a JS number for the GraphQL
  // response — values beyond float64's safe precision will lose accuracy here.
  serialize(value: string): number {
    return parseFloat(value);
  },
  parseValue(value: number): string {
    return String(value);
  },
  parseLiteral(ast): string | null {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      return String(ast.value);
    }

    return null;
  },
});
