// additionalEmails/secondaryLinks/etc. can arrive as a real array or as a
// JSON-encoded string depending on the source, so this normalizes both forms.
export const parseArrayOrJsonStringToArray = <T>(
  value: T[] | string | null | undefined,
): T[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};
