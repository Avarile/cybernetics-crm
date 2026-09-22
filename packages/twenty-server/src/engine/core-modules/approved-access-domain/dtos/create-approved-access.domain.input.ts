// GraphQL input for registering a new approved access domain.
import { InputType, Field } from '@nestjs/graphql';

import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateApprovedAccessDomainInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  domain: string;

  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
