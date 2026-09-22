/* @license Enterprise */

import type Stripe from 'stripe';

import { BillingEntitlementKey } from 'src/engine/core-modules/billing/enums/billing-entitlement-key.enum';

// Builds a BillingEntitlement row for every known entitlement key, flagging as
// active only the keys present in the Stripe entitlement summary
export const transformStripeEntitlementUpdatedEventToDatabaseEntitlement = (
  workspaceId: string,
  data: Stripe.EntitlementsActiveEntitlementSummaryUpdatedEvent.Data,
) => {
  const stripeCustomerId = data.object.customer;
  const activeEntitlementsKeys = data.object.entitlements.data.map(
    (entitlement) => entitlement.lookup_key,
  );

  return Object.values(BillingEntitlementKey).map((key) => {
    return {
      workspaceId,
      key,
      value: activeEntitlementsKeys.includes(key),
      stripeCustomerId,
    };
  });
};
