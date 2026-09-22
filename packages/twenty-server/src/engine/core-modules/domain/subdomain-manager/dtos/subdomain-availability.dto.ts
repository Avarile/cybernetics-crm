import { Field, ObjectType } from '@nestjs/graphql';

// Result of checking whether a requested subdomain is valid and available
@ObjectType()
export class SubdomainAvailabilityDTO {
  @Field(() => Boolean)
  isValid: boolean;

  @Field(() => Boolean)
  available: boolean;

  @Field(() => String)
  suggestedSubdomain: string;

  @Field(() => [String])
  suggestedSubdomains: string[];
}
