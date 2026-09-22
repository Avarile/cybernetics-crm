// GraphQL DTO for a suggested teammate email to invite during onboarding.
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('InviteSuggestion')
export class InviteSuggestionDTO {
  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  displayName?: string;
}
