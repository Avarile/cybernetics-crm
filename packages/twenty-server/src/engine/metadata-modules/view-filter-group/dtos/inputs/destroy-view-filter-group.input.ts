import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// GraphQL input for permanently destroying a view filter group by id.
@InputType()
export class DestroyViewFilterGroupInput {
  @Field(() => UUIDScalarType, {
    description: 'The id of the view filter group to destroy.',
  })
  @IsUUID()
  id: string;
}
