// GraphQL DTO for a queue's job-retention limits (max age/count).
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('QueueRetentionConfig')
export class QueueRetentionConfigDTO {
  @Field(() => Number)
  completedMaxAge: number;

  @Field(() => Number)
  completedMaxCount: number;

  @Field(() => Number)
  failedMaxAge: number;

  @Field(() => Number)
  failedMaxCount: number;
}
