// Regenerates the names of indexes belonging to an object whose singular name
// changed, since generated index names are derived from the object name.

import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';
import { findManyFlatEntityByUniversalIdentifierInUniversalFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-many-flat-entity-by-universal-identifier-in-universal-flat-entity-maps-or-throw.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { generateFlatIndexMetadataWithNameOrThrow } from 'src/engine/metadata-modules/index-metadata/utils/generate-flat-index.util';
import { type UniversalFlatIndexMetadata } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-index-metadata.type';

type RecomputeIndexAfterFlatObjectMetadataSingularNameUpdateArgs = {
  existingFlatObjectMetadata: FlatObjectMetadata;
  updatedSingularName: string;
} & Pick<AllFlatEntityMaps, 'flatIndexMaps' | 'flatFieldMetadataMaps'>;
// Rebuilds each index owned by the object with an optimistic copy of the
// object metadata carrying the new singular name, returning updated indexes.
export const recomputeIndexAfterFlatObjectMetadataSingularNameUpdate = ({
  existingFlatObjectMetadata,
  flatIndexMaps,
  updatedSingularName,
  flatFieldMetadataMaps,
}: RecomputeIndexAfterFlatObjectMetadataSingularNameUpdateArgs): UniversalFlatIndexMetadata[] => {
  const allRelatedFlatIndexMetadata =
    findManyFlatEntityByUniversalIdentifierInUniversalFlatEntityMapsOrThrow({
      universalIdentifiers:
        existingFlatObjectMetadata.indexMetadataUniversalIdentifiers,
      flatEntityMaps: flatIndexMaps,
    });

  if (allRelatedFlatIndexMetadata.length === 0) {
    return [];
  }

  const optimisticFlatObjectMetadata: FlatObjectMetadata = {
    ...existingFlatObjectMetadata,
    nameSingular: updatedSingularName,
  };

  const objectFlatFieldMetadatas =
    findManyFlatEntityByUniversalIdentifierInUniversalFlatEntityMapsOrThrow({
      flatEntityMaps: flatFieldMetadataMaps,
      universalIdentifiers:
        optimisticFlatObjectMetadata.fieldUniversalIdentifiers,
    });

  return allRelatedFlatIndexMetadata.map<UniversalFlatIndexMetadata>(
    (flatIndex) => {
      const newIndex = generateFlatIndexMetadataWithNameOrThrow({
        flatIndex,
        flatObjectMetadata: optimisticFlatObjectMetadata,
        objectFlatFieldMetadatas,
      });

      return newIndex;
    },
  );
};
