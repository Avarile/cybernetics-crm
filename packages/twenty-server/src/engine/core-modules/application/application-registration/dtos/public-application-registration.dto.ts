// GraphQL DTO exposing only the non-sensitive fields of a registration
// (used by the unauthenticated OAuth authorize page).
import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('PublicApplicationRegistration')
export class PublicApplicationRegistrationDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  logoUrl: string | null;

  @Field(() => String, { nullable: true })
  websiteUrl: string | null;

  @Field(() => [String])
  oAuthScopes: string[];
}
