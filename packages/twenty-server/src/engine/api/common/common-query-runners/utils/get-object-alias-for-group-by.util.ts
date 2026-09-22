import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';

// The SQL alias used for the base object in a groupBy query builder.
export const getObjectAlias = (
  flatObjectMetadata: FlatObjectMetadata,
): string => {
  return flatObjectMetadata.nameSingular;
};
