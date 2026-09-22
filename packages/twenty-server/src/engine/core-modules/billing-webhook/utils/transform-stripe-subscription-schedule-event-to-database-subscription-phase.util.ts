/* @license Enterprise */

import { isDefined } from 'twenty-shared/utils';

import type Stripe from 'stripe';

import { type BillingSubscriptionSchedulePhaseDTO } from 'src/engine/core-modules/billing/dtos/billing-subscription-schedule-phase.dto';

// Maps the last two phases of a Stripe subscription schedule (current and next)
// to the phase DTOs stored on the subscription
export function transformStripeSubscriptionScheduleEventToDatabaseSubscriptionPhase(
  schedule: Stripe.SubscriptionSchedule,
): Array<BillingSubscriptionSchedulePhaseDTO> {
  return schedule.phases.slice(-2).map((phase) => ({
    start_date: phase.start_date,
    end_date: phase.end_date,
    items: phase.items.map((item) => ({
      price: typeof item.price === 'string' ? item.price : item.price.id,
      ...(isDefined(item.quantity) ? { quantity: item.quantity } : {}),
    })),
  }));
}
