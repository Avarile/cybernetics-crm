import { type AllMetadataName } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ALL_MANY_TO_ONE_METADATA_RELATIONS } from 'src/engine/metadata-modules/flat-entity/constant/all-many-to-one-metadata-relations.constant';
import {
  FlatEntityMapsException,
  FlatEntityMapsExceptionCode,
} from 'src/engine/metadata-modules/flat-entity/exceptions/flat-entity-maps.exception';
import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';
import { type FlatEntityUpdate } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-update.type';
import { type MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import { type UniversalFlatEntityUpdate } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-entity-update.type';

// Update-path counterpart to resolveUniversalRelationIdentifiersToIds: rewrites each
// present universalForeignKey key in the update payload to its real foreign-key
// counterpart (deleting the universal key so it never leaks into the flat update).
// Unlike the create path, this never consults preallocatedIdByUniversalIdentifierByMetadataName
// — an update that points a relation at an entity being *created* earlier in the same
// migration (rather than one that already exists) will fail to resolve and throw
// ENTITY_NOT_FOUND, even though the equivalent create-time forward reference works.
export const resolveUniversalUpdateRelationIdentifiersToIds = <
  T extends AllMetadataName,
>({
  metadataName,
  universalUpdate,
  allFlatEntityMaps,
}: {
  metadataName: T;
  universalUpdate: UniversalFlatEntityUpdate<T>;
  allFlatEntityMaps: AllFlatEntityMaps;
}): FlatEntityUpdate<T> => {
  const relationEntries = ALL_MANY_TO_ONE_METADATA_RELATIONS[metadataName];
  const result: Record<string, unknown> = { ...universalUpdate };

  for (const relationPropertyName of Object.keys(relationEntries)) {
    const relation = relationEntries[
      relationPropertyName as keyof typeof relationEntries
    ] as {
      foreignKey: string;
      universalForeignKey: string;
      metadataName: AllMetadataName;
    } | null;

    if (!isDefined(relation)) {
      continue;
    }

    const {
      foreignKey,
      universalForeignKey,
      metadataName: targetMetadataName,
    } = relation;

    if (!Object.prototype.hasOwnProperty.call(result, universalForeignKey)) {
      continue;
    }

    const universalIdentifierValue = result[universalForeignKey] as
      | string
      | null
      | undefined;

    delete result[universalForeignKey];

    if (!isDefined(universalIdentifierValue)) {
      if (universalIdentifierValue === null) {
        result[foreignKey] = null;
      }

      continue;
    }

    const mapsKey = getMetadataFlatEntityMapsKey(targetMetadataName);

    const targetFlatEntityMaps = allFlatEntityMaps[mapsKey];

    const targetEntity = findFlatEntityByUniversalIdentifier<
      MetadataFlatEntity<typeof targetMetadataName>
    >({
      flatEntityMaps: targetFlatEntityMaps,
      universalIdentifier: universalIdentifierValue,
    });

    if (!isDefined(targetEntity)) {
      throw new FlatEntityMapsException(
        `Could not resolve ${universalForeignKey} to ${foreignKey}: no ${targetMetadataName} found for universal identifier ${universalIdentifierValue}`,
        FlatEntityMapsExceptionCode.ENTITY_NOT_FOUND,
      );
    }

    result[foreignKey] = targetEntity.id;
  }

  return result as FlatEntityUpdate<T>;
};
