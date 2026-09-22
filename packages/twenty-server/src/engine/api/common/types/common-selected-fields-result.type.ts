import { type AggregationField } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-available-aggregations-from-object-fields.util';

// Recursive select-fields map, e.g. { name: true, company: { name: true } }.
export interface CommonSelectedFields {
  [key: string]: boolean | CommonSelectedFields;
}

// Parsed form of a query's requested fields: plain selects vs. relation
// selects vs. aggregates, plus complexity-scoring metadata.
export type CommonSelectedFieldsResult = {
  select: CommonSelectedFields;
  relations: CommonSelectedFields;
  aggregate: Record<string, AggregationField>;
  relationFieldsCount?: number;
  hasAtLeastTwoNestedOneToManyRelations?: boolean;
};
