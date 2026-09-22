// GraphQL DTO for a single Google Places address autocomplete suggestion.
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('AutocompleteResult')
export class AutocompleteResultDTO {
  @Field()
  text: string;

  @Field()
  placeId: string;
}
