import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// GraphQL input for permanently destroying a view field group by id.
@InputType()
export class DestroyViewFieldGroupInput {
  @Field(() => UUIDScalarType, {
    description: 'The id of the view field group to destroy.',
  })
  @IsUUID()
  id: string;
}
