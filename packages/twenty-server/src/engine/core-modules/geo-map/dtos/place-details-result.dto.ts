// GraphQL DTOs for a resolved place's structured address and coordinates.
import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType('Location')
export class LocationDTO {
  @Field(() => Float, { nullable: true })
  lat?: number;

  @Field(() => Float, { nullable: true })
  lng?: number;
}

@ObjectType('PlaceDetailsResult')
export class PlaceDetailsResultDTO {
  @Field({ nullable: true })
  street?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  postcode?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  country?: string;

  @Field(() => LocationDTO, { nullable: true })
  location?: LocationDTO;
}
