import { Field, ObjectType } from '@nestjs/graphql';
import { ViewKey, ViewType } from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// Minimal, bootstrap-friendly subset of a view's metadata.
@ObjectType('MinimalView')
export class MinimalViewDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => ViewType)
  type: ViewType;

  @Field(() => ViewKey, { nullable: true })
  key: ViewKey | null;

  @Field(() => UUIDScalarType)
  objectMetadataId: string;
}
