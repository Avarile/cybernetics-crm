import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type IndexFieldMetadataEntity } from 'src/engine/metadata-modules/index-metadata/index-field-metadata.entity';
import { type IndexMetadataEntity } from 'src/engine/metadata-modules/index-metadata/index-metadata.entity';
import { type UniversalFlatIndexMetadata } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-index-metadata.type';

// Flat (denormalized) representation of an IndexFieldMetadataEntity used during workspace metadata diffing.
export type FlatIndexFieldMetadata = FlatEntityFrom<IndexFieldMetadataEntity>;

// Flat (denormalized) representation of an IndexMetadataEntity, including its flat index
// fields and the universal-identifier form used for cross-workspace metadata diffing.
export type FlatIndexMetadata = FlatEntityFrom<IndexMetadataEntity> & {
  flatIndexFieldMetadatas: FlatIndexFieldMetadata[];
} & Pick<UniversalFlatIndexMetadata, 'universalFlatIndexFieldMetadatas'>;
