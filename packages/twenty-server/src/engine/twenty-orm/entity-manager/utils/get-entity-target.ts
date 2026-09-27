import { isDefined } from 'twenty-shared/utils';
import {
  type EntityTarget,
  InstanceChecker,
  type ObjectLiteral,
  type SaveOptions,
} from 'typeorm';

import { type DeepPartialWithNestedRelationFields } from 'src/engine/twenty-orm/entity-manager/types/deep-partial-entity-with-nested-relation-fields.type';

// TypeORM's EntityManager methods are overloaded as either save(entity) or
// save(target, entity) — this disambiguates the two call shapes to recover the
// entity class/target either way, falling back to the entity's own constructor.
export const getEntityTarget = <
  Entity extends ObjectLiteral,
  T extends DeepPartialWithNestedRelationFields<Entity>,
>(
  targetOrEntity: EntityTarget<Entity> | Entity | Entity[],
  entityOrMaybeOptions:
    | T
    | T[]
    | SaveOptions
    | (SaveOptions & { reload: false }),
) => {
  const isEntityTarget =
    (typeof targetOrEntity === 'function' ||
      InstanceChecker.isEntitySchema(targetOrEntity) ||
      typeof targetOrEntity === 'string') &&
    isDefined(targetOrEntity);

  const entityTarget = isEntityTarget ? targetOrEntity : null;

  if (entityTarget) return entityTarget;

  const entityData = isEntityTarget ? entityOrMaybeOptions : targetOrEntity;
  const isEntityArray = Array.isArray(entityData);

  return isEntityArray ? entityData[0]?.constructor : entityData.constructor;
};
