// GraphQL DTO for a single (x, y) point on a queue metrics graph.
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('QueueMetricsDataPoint')
export class QueueMetricsDataPointDTO {
  @Field(() => Number)
  x: number;

  @Field(() => Number)
  y: number;
}
