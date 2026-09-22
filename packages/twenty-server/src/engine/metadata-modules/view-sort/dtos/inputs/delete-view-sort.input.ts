import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// GraphQL input for soft-deleting a view sort by id.
@InputType()
export class DeleteViewSortInput {
  @Field(() => UUIDScalarType, {
    description: 'The id of the view sort to delete.',
  })
  @IsUUID()
  id: string;
}
