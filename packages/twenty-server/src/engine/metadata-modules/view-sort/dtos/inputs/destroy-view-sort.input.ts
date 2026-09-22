import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// GraphQL input for permanently destroying a view sort by id.
@InputType()
export class DestroyViewSortInput {
  @Field(() => UUIDScalarType, {
    description: 'The id of the view sort to destroy.',
  })
  @IsUUID()
  id: string;
}
