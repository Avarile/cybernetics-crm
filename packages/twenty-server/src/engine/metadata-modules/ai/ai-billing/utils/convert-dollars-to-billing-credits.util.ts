import { DOLLAR_TO_CREDIT_MULTIPLIER } from 'src/engine/metadata-modules/ai/ai-billing/constants/dollar-to-credit-multiplier';

// Converts a dollar cost into the micro-credit unit used by billing usage events.
export const convertDollarsToBillingCredits = (dollars: number): number =>
  dollars * DOLLAR_TO_CREDIT_MULTIPLIER;
