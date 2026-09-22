// GraphQL representation of a workspace's aggregate AI usage counts.
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('WorkspaceAiStats')
export class WorkspaceAiStatsDTO {
  @Field(() => Int)
  conversationsCount: number;

  @Field(() => Int)
  skillsCount: number;

  @Field(() => Int)
  toolsCount: number;
}
