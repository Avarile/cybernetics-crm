// REST-specific DTO combining an object's metadata with its resolved fields
// (the GraphQL DTO exposes fields via a cursor connection instead).

import { type FieldMetadataDTO } from 'src/engine/metadata-modules/field-metadata/dtos/field-metadata.dto';
import { type ObjectMetadataDTO } from 'src/engine/metadata-modules/object-metadata/dtos/object-metadata.dto';

export type ObjectMetadataWithFieldsDTO = ObjectMetadataDTO & {
  fields: FieldMetadataDTO[];
};
