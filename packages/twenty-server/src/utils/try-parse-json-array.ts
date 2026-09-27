export const tryParseJsonArray = (value: string): unknown[] | null => {
  try {
    const parsed = JSON.parse(value);

    // null covers both invalid JSON and valid JSON that isn't an array (eg: an object or number).
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
