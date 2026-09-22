import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatSearchFieldMetadata } from 'src/engine/metadata-modules/flat-search-field-metadata/types/flat-search-field-metadata.type';

// Denormalized, id/universal-identifier indexed collection of all flat search field metadata in a workspace.
export type FlatSearchFieldMetadataMaps =
  FlatEntityMaps<FlatSearchFieldMetadata>;
