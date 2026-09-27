import { type AllMetadataName } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ALL_MANY_TO_ONE_METADATA_RELATIONS } from 'src/engine/metadata-modules/flat-entity/constant/all-many-to-one-metadata-relations.constant';
import { ALL_ONE_TO_MANY_METADATA_RELATIONS } from 'src/engine/metadata-modules/flat-entity/constant/all-one-to-many-metadata-relations.constant';
import {
  FlatEntityMapsException,
  FlatEntityMapsExceptionCode,
} from 'src/engine/metadata-modules/flat-entity/exceptions/flat-entity-maps.exception';
import { type MetadataRelatedFlatEntityMapsKeys } from 'src/engine/metadata-modules/flat-entity/types/metadata-related-flat-entity-maps-keys.type';
import { type MetadataUniversalFlatEntityAndRelatedUniversalFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/metadata-related-types.type';
import { type MetadataUniversalFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-universal-flat-entity.type';
import { findFlatEntityByUniversalIdentifierOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier-or-throw.util';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import { type UniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-entity-maps.type';
import { addUniversalFlatEntityToUniversalFlatEntityMapsThroughMutationOrThrow } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/add-universal-flat-entity-to-universal-flat-entity-maps-through-mutation-or-throw.util';
import { replaceUniversalFlatEntityInUniversalFlatEntityMapsThroughMutationOrThrow } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/replace-universal-flat-entity-in-universal-flat-entity-maps-through-mutation-or-throw.util';

type AddUniversalFlatEntityToUniversalFlatEntityAndRelatedEntityMapsThroughMutationOrThrowArgs<
  T extends AllMetadataName,
> = {
  metadataName: T;
  universalFlatEntity: MetadataUniversalFlatEntity<T>;
  universalFlatEntityAndRelatedMapsToMutate: MetadataUniversalFlatEntityAndRelatedUniversalFlatEntityMaps<T>;
  skipMissingRelatedEntities?: boolean;
};

// Beyond adding the entity itself, this is what actually maintains the derived
// "foreign-key aggregator" reverse-side lists (e.g. an object's list of its fields'
// universalIdentifiers, see all-universal-flat-entity-foreign-key-aggregator-properties.constant.ts):
// for each many-to-one relation this entity has, it finds the referenced parent entity
// and appends this entity's universalIdentifier onto the parent's aggregator array.
// skipMissingRelatedEntities exists for cases like searchFieldMetadata, which can be
// added before its parent object/fields are in the maps yet — there's nothing to
// back-link to in that case, so it's silently skipped rather than throwing.
export const addUniversalFlatEntityToUniversalFlatEntityAndRelatedEntityMapsThroughMutationOrThrow =
  <T extends AllMetadataName>({
    metadataName,
    universalFlatEntity,
    universalFlatEntityAndRelatedMapsToMutate,
    skipMissingRelatedEntities = false,
  }: AddUniversalFlatEntityToUniversalFlatEntityAndRelatedEntityMapsThroughMutationOrThrowArgs<T>) => {
    const flatEntityMapsKey = getMetadataFlatEntityMapsKey(metadataName);

    addUniversalFlatEntityToUniversalFlatEntityMapsThroughMutationOrThrow({
      universalFlatEntity,
      universalFlatEntityMapsToMutate:
        universalFlatEntityAndRelatedMapsToMutate[flatEntityMapsKey],
    });

    const manyToOneRelations = ALL_MANY_TO_ONE_METADATA_RELATIONS[metadataName];

    for (const relationPropertyName of Object.keys(manyToOneRelations)) {
      const relation = manyToOneRelations[
        relationPropertyName as keyof typeof manyToOneRelations
      ] as {
        metadataName: AllMetadataName;
        inverseOneToManyProperty: string | null;
        universalForeignKey: string;
      } | null;

      if (!isDefined(relation)) {
        continue;
      }

      const {
        metadataName: relatedMetadataName,
        inverseOneToManyProperty,
        universalForeignKey,
      } = relation;

      if (!isDefined(inverseOneToManyProperty)) {
        continue;
      }

      const oneToManyRelations =
        ALL_ONE_TO_MANY_METADATA_RELATIONS[relatedMetadataName];

      const inverseRelation = oneToManyRelations[
        inverseOneToManyProperty as keyof typeof oneToManyRelations
      ] as {
        universalFlatEntityForeignKeyAggregator: string;
      } | null;

      if (!isDefined(inverseRelation)) {
        continue;
      }

      const { universalFlatEntityForeignKeyAggregator } = inverseRelation;

      const relatedFlatEntityMapsKey =
        getMetadataFlatEntityMapsKey(relatedMetadataName);

      const relatedUniversalFlatEntityMaps =
        universalFlatEntityAndRelatedMapsToMutate[
          relatedFlatEntityMapsKey as MetadataRelatedFlatEntityMapsKeys<T>
        ] as UniversalFlatEntityMaps<
          MetadataUniversalFlatEntity<typeof relatedMetadataName>
        >;

      const universalForeignKeyValue = (
        universalFlatEntity as unknown as Record<string, string | undefined>
      )[universalForeignKey];

      if (!isDefined(universalForeignKeyValue)) {
        continue;
      }

      if (skipMissingRelatedEntities) {
        const maybeRelatedUniversalFlatEntity =
          findFlatEntityByUniversalIdentifier({
            universalIdentifier: universalForeignKeyValue,
            flatEntityMaps: relatedUniversalFlatEntityMaps,
          });

        if (!isDefined(maybeRelatedUniversalFlatEntity)) {
          continue;
        }
      }

      const relatedUniversalFlatEntity =
        findFlatEntityByUniversalIdentifierOrThrow({
          universalIdentifier: universalForeignKeyValue,
          flatEntityMaps: relatedUniversalFlatEntityMaps,
        });

      if (
        !Object.prototype.hasOwnProperty.call(
          relatedUniversalFlatEntity,
          universalFlatEntityForeignKeyAggregator,
        )
      ) {
        throw new FlatEntityMapsException(
          `Should never occur, invalid flat entity typing. flat ${relatedMetadataName} should contain ${universalFlatEntityForeignKeyAggregator} (metadataName: ${metadataName}, universalIdentifier: ${universalFlatEntity.universalIdentifier})`,
          FlatEntityMapsExceptionCode.ENTITY_MALFORMED,
          {
            context: {
              universalIdentifier: universalFlatEntity.universalIdentifier,
              metadataName,
              relatedMetadataName,
              operation: 'add',
            },
          },
        );
      }

      const updatedRelatedEntity = {
        ...relatedUniversalFlatEntity,
        [universalFlatEntityForeignKeyAggregator]: [
          ...((
            relatedUniversalFlatEntity as unknown as Record<string, string[]>
          )[universalFlatEntityForeignKeyAggregator] ?? []),
          universalFlatEntity.universalIdentifier,
        ],
      };

      replaceUniversalFlatEntityInUniversalFlatEntityMapsThroughMutationOrThrow(
        {
          universalFlatEntity: updatedRelatedEntity,
          universalFlatEntityMapsToMutate: relatedUniversalFlatEntityMaps,
        },
      );
    }
  };
