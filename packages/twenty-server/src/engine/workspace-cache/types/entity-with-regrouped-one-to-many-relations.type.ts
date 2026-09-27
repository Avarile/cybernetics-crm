import { type ExtractEntityOneToManyEntityRelationProperties } from 'src/engine/metadata-modules/flat-entity/types/extract-entity-one-to-many-entity-relation-properties.type';
import { type RegroupedEntity } from 'src/engine/workspace-cache/utils/regroup-entities-by-related-entity-id';
import { type SyncableEntity } from 'src/engine/workspace-manager/types/syncable-entity.interface';

// Replaces an entity's one-to-many relation arrays (full child entities) with slim
// {id, universalIdentifier} projections, since flat-entity conversion only needs those
// two fields from each child, not the full row.
export type EntityWithRegroupedOneToManyRelations<
  TEntity extends SyncableEntity,
> = Omit<
  TEntity,
  ExtractEntityOneToManyEntityRelationProperties<TEntity, SyncableEntity>
> & {
  [P in ExtractEntityOneToManyEntityRelationProperties<
    TEntity,
    SyncableEntity
  >]: RegroupedEntity[];
};
