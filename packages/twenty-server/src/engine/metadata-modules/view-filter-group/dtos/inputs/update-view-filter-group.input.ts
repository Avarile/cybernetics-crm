import { InputType, PartialType } from '@nestjs/graphql';

import { CreateViewFilterGroupInput } from './create-view-filter-group.input';

// GraphQL/REST input for partially updating an existing view filter group.
@InputType()
export class UpdateViewFilterGroupInput extends PartialType(
  CreateViewFilterGroupInput,
) {}
