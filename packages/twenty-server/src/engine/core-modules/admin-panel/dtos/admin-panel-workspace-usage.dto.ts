import { Field, Float, ObjectType } from '@nestjs/graphql';

// Credit usage for a workspace over a billing period, shown in the admin panel
@ObjectType('AdminPanelWorkspaceUsage')
export class AdminPanelWorkspaceUsageDTO {
  @Field(() => Date)
  periodStart: Date;

  @Field(() => Date)
  periodEnd: Date;

  @Field(() => Float)
  usedCredits: number;

  @Field(() => Float)
  grantedCredits: number;

  @Field(() => Float)
  rolloverCredits: number;

  @Field(() => Float)
  totalGrantedCredits: number;

  @Field(() => Float)
  remainingCredits: number;
}
