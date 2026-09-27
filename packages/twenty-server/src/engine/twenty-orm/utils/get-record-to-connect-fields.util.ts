import { type RelationConnectQueryConfig } from 'src/engine/twenty-orm/entity-manager/types/relation-connect-query-config.type';

// Uses only the first condition's fields to build the SELECT list, relying on the same
// "every condition in the batch uses the same fields" invariant enforced upstream by
// checkUniqueConstraintsAreSameOrThrow.
export const getRecordToConnectFields = (
  connectQueryConfig: RelationConnectQueryConfig,
) => {
  return [
    `"${connectQueryConfig.targetObjectName}"."id"`,
    ...connectQueryConfig.recordToConnectConditions[0].map(([field]) => {
      return `"${connectQueryConfig.targetObjectName}"."${field}"`;
    }),
  ];
};
