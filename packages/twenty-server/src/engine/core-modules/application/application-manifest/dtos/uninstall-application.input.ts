// GraphQL args for the uninstallApplication mutation.
import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class UninstallApplicationInput {
  @Field(() => String)
  universalIdentifier: string;
}
