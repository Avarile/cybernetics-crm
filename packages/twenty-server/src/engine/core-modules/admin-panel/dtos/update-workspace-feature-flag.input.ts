// GraphQL args for toggling a feature flag on a specific workspace.
import { ArgsType, Field } from '@nestjs/graphql';

import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';
import { FeatureFlagKey } from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ArgsType()
export class UpdateWorkspaceFeatureFlagInput {
  @Field(() => UUIDScalarType)
  @IsNotEmpty()
  @IsUUID()
  workspaceId: string;

  @Field(() => String)
  @IsNotEmpty()
  featureFlag: FeatureFlagKey;

  @Field(() => Boolean)
  @IsBoolean()
  value: boolean;
}
