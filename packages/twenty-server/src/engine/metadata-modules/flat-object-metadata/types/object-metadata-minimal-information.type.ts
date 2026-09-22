// Minimal subset of flat object metadata needed for lightweight identification (e.g. error messages).
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';

export type ObjectMetadataMinimalInformation = Partial<
  Pick<FlatObjectMetadata, 'id' | 'namePlural' | 'nameSingular'>
>;
