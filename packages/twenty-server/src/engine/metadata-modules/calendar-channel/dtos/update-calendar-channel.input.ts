import { Field, InputType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  CalendarChannelContactAutoCreationPolicy,
  CalendarChannelVisibility,
} from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// User-editable calendar channel fields exposed through the update mutation.
@InputType()
export class UpdateCalendarChannelInputUpdates {
  @IsOptional()
  @IsEnum(CalendarChannelVisibility)
  @Field(() => CalendarChannelVisibility, { nullable: true })
  visibility?: CalendarChannelVisibility;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isContactAutoCreationEnabled?: boolean;

  @IsOptional()
  @IsEnum(CalendarChannelContactAutoCreationPolicy)
  @Field(() => CalendarChannelContactAutoCreationPolicy, { nullable: true })
  contactAutoCreationPolicy?: CalendarChannelContactAutoCreationPolicy;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isSyncEnabled?: boolean;
}

// Input for the updateCalendarChannel mutation: target channel id plus the fields to change.
@InputType()
export class UpdateCalendarChannelInput {
  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType)
  id: string;

  @Type(() => UpdateCalendarChannelInputUpdates)
  @ValidateNested()
  @Field(() => UpdateCalendarChannelInputUpdates)
  update: UpdateCalendarChannelInputUpdates;
}
