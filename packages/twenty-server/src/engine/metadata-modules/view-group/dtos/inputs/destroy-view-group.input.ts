import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// GraphQL input for permanently destroying a view group by id.
@InputType()
export class DestroyViewGroupInput {
  @Field(() => UUIDScalarType, {
    description: 'The id of the view group to destroy.',
  })
  @IsUUID()
  id: string;
}
