import { type AllMetadataName } from 'twenty-shared/metadata';

import { type MetadataManyToOneRelatedMetadataNames } from 'src/engine/metadata-modules/flat-entity/types/metadata-many-to-one-related-metadata-names.type';

// One id->universalIdentifier lookup map per many-to-one relation of T, so an entity->flat-entity
// conversion can resolve DB-local relation ids (which differ per workspace) into the stable
// universalIdentifier used in the flat representation.
export type EntityManyToOneIdByUniversalIdentifierMaps<
  T extends AllMetadataName,
> = {
  [P in MetadataManyToOneRelatedMetadataNames<T> as `${P}IdToUniversalIdentifierMap`]: Map<
    string,
    string
  >;
} & {
  applicationIdToUniversalIdentifierMap: Map<string, string>;
};
