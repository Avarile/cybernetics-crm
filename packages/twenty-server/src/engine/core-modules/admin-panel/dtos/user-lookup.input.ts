// GraphQL args for looking up a user by email or id in the admin panel.
import { ArgsType, Field } from '@nestjs/graphql';

import { IsNotEmpty, IsString } from 'class-validator';

@ArgsType()
export class UserLookupInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  userIdentifier: string;
}
