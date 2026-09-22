// GraphQL args for the resendEmailVerificationToken mutation.
import { ArgsType, Field } from '@nestjs/graphql';

import { IsEmail, IsNotEmpty } from 'class-validator';

@ArgsType()
export class ResendEmailVerificationTokenInput {
  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
