// GraphQL args for registering a new public domain for an application.
import { ArgsType, Field } from '@nestjs/graphql';

import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@ArgsType()
export class CreatePublicDomainInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  domain: string;

  @Field(() => String)
  @IsUUID()
  applicationId: string;
}
