// Strips the `secret` field from a record before it's exposed in a webhook payload.
export const removeSecretFromWebhookRecord = (
  // oxlint-disable-next-line typescript/no-explicit-any
  record: Record<string, any> | undefined,
  isWebhookEvent: boolean,
  // oxlint-disable-next-line typescript/no-explicit-any
): Record<string, any> | undefined => {
  if (!isWebhookEvent || !record) return record;

  const { secret: _secret, ...sanitizedRecord } = record;

  return sanitizedRecord;
};
