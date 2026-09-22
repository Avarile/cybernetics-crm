import { Field, Float, InputType } from '@nestjs/graphql';

import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageLayoutTabLayoutMode } from 'twenty-shared/types';

// GraphQL/REST input for partially updating an existing page layout tab.
@InputType()
export class UpdatePageLayoutTabInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  position?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  icon?: string | null;

  @Field(() => PageLayoutTabLayoutMode, { nullable: true })
  @IsEnum(PageLayoutTabLayoutMode)
  @IsOptional()
  layoutMode?: PageLayoutTabLayoutMode;
}
