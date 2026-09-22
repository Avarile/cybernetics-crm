import { Field, HideField, InputType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// Partial set of front component fields that can be updated.
@InputType()
export class UpdateFrontComponentInputUpdates {
  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  name?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  description?: string;

  @IsOptional()
  @IsString()
  @HideField()
  builtComponentChecksum?: string;
}

// GraphQL input for updating an existing front component by id.
@InputType()
export class UpdateFrontComponentInput {
  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType, {
    description: 'The id of the front component to update',
  })
  id: string;

  @Type(() => UpdateFrontComponentInputUpdates)
  @ValidateNested()
  @Field(() => UpdateFrontComponentInputUpdates, {
    description: 'The front component fields to update',
  })
  update: UpdateFrontComponentInputUpdates;
}
