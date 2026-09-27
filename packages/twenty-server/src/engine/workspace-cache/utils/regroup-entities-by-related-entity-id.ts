import { isDefined } from 'class-validator';
import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-entity.type';
import { type MetadataManyToOneJoinColumn } from 'src/engine/metadata-modules/flat-entity/types/metadata-many-to-one-join-column.type';

export type RegroupedEntity = { id: string; universalIdentifier: string };

export type RegroupEntitiesByRelatedEntityIdArgs<T extends AllMetadataName> =
  MetadataManyToOneJoinColumn<T> extends never
    ? never
    : {
        entities: MetadataEntity<T>[];
        foreignKey: MetadataManyToOneJoinColumn<T>;
      };
// Groups child entities by their many-to-one foreign key value, so a parent entity's
// one-to-many relation array can be looked up by the parent's own id (used when building
// flat entities, where the one-to-many side isn't a real relation on the child row).
export const regroupEntitiesByRelatedEntityId = <T extends AllMetadataName>({
  entities,
  foreignKey,
}: RegroupEntitiesByRelatedEntityIdArgs<T>) => {
  const entitiesByRelatedEntityId = new Map<string, MetadataEntity<T>[]>();

  for (const entity of entities) {
    const currentRelatedEntityId = entity[
      foreignKey as keyof MetadataEntity<T>
    ] as string;

    if (!isDefined(currentRelatedEntityId)) {
      continue;
    }

    if (!entitiesByRelatedEntityId.has(currentRelatedEntityId)) {
      entitiesByRelatedEntityId.set(currentRelatedEntityId, []);
    }

    entitiesByRelatedEntityId.get(currentRelatedEntityId)!.push(entity);
  }

  return entitiesByRelatedEntityId;
};
