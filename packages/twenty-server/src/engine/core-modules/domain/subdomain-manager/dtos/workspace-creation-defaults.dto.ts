import { Field, ObjectType } from '@nestjs/graphql';

// Suggested display name and subdomain to prefill during workspace creation
@ObjectType()
export class WorkspaceCreationDefaultsDTO {
  @Field(() => String)
  displayName: string;

  @Field(() => String)
  subdomain: string;
}
