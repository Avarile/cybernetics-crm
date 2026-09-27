import {
  ALL_METADATA_NAME,
  type AllMetadataName,
} from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import { type AllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/all-universal-flat-entity-maps.type';

export type UniversalIdentifierOwner = {
  metadataName: AllMetadataName;
  applicationUniversalIdentifier: string;
};

export type AllUniversalIdentifierMap = Map<string, UniversalIdentifierOwner>;

// Flattens every metadata type's flat entity maps into one lookup, keyed by
// universalIdentifier, because universalIdentifiers must be unique across ALL metadata
// types (not just within one type) — used by the cross-entity uniqueness validator to
// find collisions between, say, an object and a role sharing the same identifier.
export const buildAllUniversalIdentifierMap = (
  allFlatEntityMaps: AllUniversalFlatEntityMaps,
): AllUniversalIdentifierMap => {
  const universalIdentifierMap: AllUniversalIdentifierMap = new Map();

  for (const metadataName of Object.values(ALL_METADATA_NAME)) {
    const flatEntityMapsKey = getMetadataFlatEntityMapsKey(metadataName);
    const flatEntityMaps = allFlatEntityMaps[flatEntityMapsKey];

    if (!isDefined(flatEntityMaps)) {
      continue;
    }

    for (const [universalIdentifier, entity] of Object.entries(
      flatEntityMaps.byUniversalIdentifier,
    )) {
      if (isDefined(entity)) {
        universalIdentifierMap.set(universalIdentifier, {
          metadataName,
          applicationUniversalIdentifier: entity.applicationUniversalIdentifier,
        });
      }
    }
  }

  return universalIdentifierMap;
};
