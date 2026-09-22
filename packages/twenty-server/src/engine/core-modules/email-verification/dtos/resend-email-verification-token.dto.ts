// GraphQL response DTO for the resendEmailVerificationToken mutation.
import { Field, ObjectType } from '@nestjs/graphql';

import { IsBoolean } from 'class-validator';

@ObjectType('ResendEmailVerificationToken')
export class ResendEmailVerificationTokenDTO {
  @IsBoolean()
  @Field(() => Boolean)
  success: boolean;
}
