import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import {
  ALL_METADATA_NAME,
  type AllMetadataName,
} from 'twenty-shared/metadata';

registerEnumType(ALL_METADATA_NAME, {
  name: 'AllMetadataName',
});

// Cache hash for one metadata collection, letting clients detect when to refetch it.
@ObjectType('CollectionHash')
export class CollectionHashDTO {
  @Field(() => ALL_METADATA_NAME)
  collectionName: AllMetadataName;

  @Field(() => String)
  hash: string;
}
