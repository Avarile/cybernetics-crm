// GraphQL DTO for a public domain registered by a workspace application.
import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('PublicDomain')
export class PublicDomainDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field({ nullable: false })
  domain: string;

  @Field({ nullable: false })
  isValidated: boolean;

  @Field(() => UUIDScalarType, { nullable: true })
  applicationId: string | null;

  @Field()
  createdAt: Date;
}
