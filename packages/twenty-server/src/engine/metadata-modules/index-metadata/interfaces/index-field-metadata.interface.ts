// Plain interface describing an index-field relationship for legacy (non-flat)
// code paths that still reference the TypeORM entities directly.

import { type IndexMetadataInterface } from 'src/engine/metadata-modules/index-metadata/interfaces/index-metadata.interface';

import { type FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';

export interface IndexFieldMetadataInterface {
  id: string;
  indexMetadataId: string;
  fieldMetadataId: string;
  fieldMetadata: FieldMetadataEntity;
  indexMetadata: IndexMetadataInterface;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
