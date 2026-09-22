import { Field, Float, ObjectType } from '@nestjs/graphql';

import { AdminPanelWorkspaceSubscriptionDTO } from 'src/engine/core-modules/admin-panel/dtos/admin-panel-workspace-subscription.dto';
import { AdminPanelWorkspaceUsageDTO } from 'src/engine/core-modules/admin-panel/dtos/admin-panel-workspace-usage.dto';

// Combined billing snapshot (subscription + usage) for a workspace, shown in the admin panel
@ObjectType('AdminPanelWorkspaceBilling')
export class AdminPanelWorkspaceBillingDTO {
  @Field(() => String, { nullable: true })
  stripeCustomerId: string | null;

  @Field(() => Float, { nullable: true })
  creditBalance: number | null;

  @Field(() => AdminPanelWorkspaceSubscriptionDTO, { nullable: true })
  subscription: AdminPanelWorkspaceSubscriptionDTO | null;

  @Field(() => AdminPanelWorkspaceUsageDTO, { nullable: true })
  usage: AdminPanelWorkspaceUsageDTO | null;
}
