// Adds a LEFT JOIN for a relation to the query builder, skipping it if
// that alias has already been joined (filters/orderBy on the same
// relation shouldn't join it twice).
import { type ObjectLiteral } from 'typeorm';

import { type WorkspaceSelectQueryBuilder } from 'src/engine/twenty-orm/repository/workspace-select-query-builder';

type AddRelationJoinAliasToQueryBuilderArgs = {
  queryBuilder: WorkspaceSelectQueryBuilder<ObjectLiteral>;
  parentAlias: string;
  relationName: string;
};

// Joins `parentAlias.relationName` under alias `relationName` if not already joined.
export const addRelationJoinAliasToQueryBuilder = ({
  queryBuilder,
  parentAlias,
  relationName,
}: AddRelationJoinAliasToQueryBuilderArgs): void => {
  const alreadyJoined = queryBuilder.expressionMap.joinAttributes.some(
    (joinAttribute) => joinAttribute.alias.name === relationName,
  );

  if (alreadyJoined) {
    return;
  }

  queryBuilder.leftJoin(`${parentAlias}.${relationName}`, relationName);
};
