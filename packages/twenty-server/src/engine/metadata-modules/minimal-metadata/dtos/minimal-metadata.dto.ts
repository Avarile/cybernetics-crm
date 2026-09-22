import { Field, ObjectType } from '@nestjs/graphql';

import { CollectionHashDTO } from 'src/engine/metadata-modules/minimal-metadata/dtos/collection-hash.dto';
import { MinimalObjectMetadataDTO } from 'src/engine/metadata-modules/minimal-metadata/dtos/minimal-object-metadata.dto';
import { MinimalViewDTO } from 'src/engine/metadata-modules/minimal-metadata/dtos/minimal-view.dto';

// Lightweight bootstrap payload (object metadata, views, collection hashes) fetched
// on app load before the full metadata schema is loaded.
@ObjectType('MinimalMetadata')
export class MinimalMetadataDTO {
  @Field(() => [MinimalObjectMetadataDTO])
  objectMetadataItems: MinimalObjectMetadataDTO[];

  @Field(() => [MinimalViewDTO])
  views: MinimalViewDTO[];

  @Field(() => [CollectionHashDTO])
  collectionHashes: CollectionHashDTO[];
}
