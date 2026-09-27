import { isDefined } from 'twenty-shared/utils';

import { type MetadataFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity-maps.type';

// Checks fields being created earlier in this same migration first, since they won't be
// in flatFieldMetadataMaps yet, then falls back to already-persisted fields.
export const findFieldMetadataIdInCreateFieldContext = ({
  universalIdentifier,
  allFieldIdToBeCreatedInActionByUniversalIdentifierMap,
  flatFieldMetadataMaps,
}: {
  universalIdentifier: string;
  allFieldIdToBeCreatedInActionByUniversalIdentifierMap: Map<string, string>;
  flatFieldMetadataMaps: MetadataFlatEntityMaps<'fieldMetadata'>;
}): string | null => {
  const generatedId =
    allFieldIdToBeCreatedInActionByUniversalIdentifierMap.get(
      universalIdentifier,
    );

  if (isDefined(generatedId)) {
    return generatedId;
  }

  const existingField =
    flatFieldMetadataMaps.byUniversalIdentifier[universalIdentifier];

  return existingField?.id ?? null;
};
