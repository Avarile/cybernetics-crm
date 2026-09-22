import { MessageSuppressionReason } from 'src/engine/core-modules/emailing-domain/types/message-suppression-reason.type';

// Bounce/complaint suppress future sends outright; unsubscribe only blocks
// that recipient's opted-out topics, so it's excluded from the hard list.
export const HARD_SUPPRESSION_REASONS = [
  MessageSuppressionReason.BOUNCE,
  MessageSuppressionReason.COMPLAINT,
];

export const GLOBAL_BLOCKING_SUPPRESSION_REASONS = [
  ...HARD_SUPPRESSION_REASONS,
  MessageSuppressionReason.UNSUBSCRIBE,
];
