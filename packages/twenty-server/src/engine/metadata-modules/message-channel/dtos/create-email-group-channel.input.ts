import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

// GraphQL input for creating a shared email-group inbox, identified by
// the group's outward-facing email handle.
@InputType('CreateEmailGroupChannelInput')
export class CreateEmailGroupChannelInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254)
  handle: string;
}
