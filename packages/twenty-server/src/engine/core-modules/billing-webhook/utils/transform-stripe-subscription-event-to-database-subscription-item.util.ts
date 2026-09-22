/* @license Enterprise */

import type Stripe from 'stripe';

// Maps each Stripe subscription item on the event to a BillingSubscriptionItem row
export const transformStripeSubscriptionEventToDatabaseSubscriptionItem = (
  billingSubscriptionId: string,
  data:
    | Stripe.CustomerSubscriptionUpdatedEvent.Data
    | Stripe.CustomerSubscriptionCreatedEvent.Data
    | Stripe.CustomerSubscriptionDeletedEvent.Data,
  workspaceId: string,
) => {
  return data.object.items.data.map((item) => {
    return {
      billingSubscriptionId,
      workspaceId,
      stripeSubscriptionId: data.object.id,
      stripeProductId: String(item.price.product),
      stripePriceId: item.price.id,
      stripeSubscriptionItemId: item.id,
      quantity: item.quantity,
      metadata: item.metadata,
      billingThresholds:
        item.billing_thresholds === null ? undefined : item.billing_thresholds,
    };
  });
};
