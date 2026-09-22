// GraphQL DTO reporting the outcome of one job operation (retry/delete) in a
// bulk queue-job action.
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('JobOperationResult')
export class JobOperationResultDTO {
  @Field(() => String)
  jobId: string;

  @Field(() => Boolean)
  success: boolean;

  @Field(() => String, { nullable: true })
  error?: string;
}
