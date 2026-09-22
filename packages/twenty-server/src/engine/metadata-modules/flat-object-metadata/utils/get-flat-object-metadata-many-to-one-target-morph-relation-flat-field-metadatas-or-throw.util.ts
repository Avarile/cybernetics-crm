// Given an object's flat field metadatas, resolves the morph-relation target
// fields reached through its many-to-one RELATION fields.

import { FieldMetadataType } from 'twenty-shared/types';

import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps-or-throw.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { isFlatFieldMetadataOfType } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-flat-field-metadata-of-type.util';

type GetFlatObjectMetadataTargetMorphRelationFlatFieldMetadatasOrThrowArgs = {
  objectFlatFieldMetadatas: FlatFieldMetadata[];
} & Pick<AllFlatEntityMaps, 'flatFieldMetadataMaps'>;
// Filters the object's fields down to RELATION fields, resolves each one's
// target field, and keeps only those targets that are MORPH_RELATION fields.
export const getFlatObjectMetadataTargetMorphRelationFlatFieldMetadatasOrThrow =
  ({
    objectFlatFieldMetadatas,
    flatFieldMetadataMaps,
  }: GetFlatObjectMetadataTargetMorphRelationFlatFieldMetadatasOrThrowArgs): FlatFieldMetadata<FieldMetadataType.MORPH_RELATION>[] => {
    return objectFlatFieldMetadatas.flatMap((flatFieldMetadata) => {
      if (
        !isFlatFieldMetadataOfType(
          flatFieldMetadata,
          FieldMetadataType.RELATION,
        )
      ) {
        return [];
      }

      const targetFlatFieldMetadata = findFlatEntityByIdInFlatEntityMapsOrThrow(
        {
          flatEntityId: flatFieldMetadata.relationTargetFieldMetadataId,
          flatEntityMaps: flatFieldMetadataMaps,
        },
      );

      return isFlatFieldMetadataOfType(
        targetFlatFieldMetadata,
        FieldMetadataType.MORPH_RELATION,
      )
        ? [targetFlatFieldMetadata]
        : [];
    });
  };
