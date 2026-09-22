/* @license Enterprise */

// GraphQL response DTO for deleting an SSO identity provider.
import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('DeleteSso')
export class DeleteSsoDTO {
  @Field(() => UUIDScalarType)
  identityProviderId: string;
}
