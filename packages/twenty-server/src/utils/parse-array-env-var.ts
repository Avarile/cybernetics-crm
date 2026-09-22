// Parses a comma-separated env var into a list of known enum-like values,
// dropping any unrecognized entries and falling back to defaults when empty/unset.
export const parseArrayEnvVar = <T>(
  envVar: string | undefined,
  expectedValues: T[],
  defaultValues: T[],
): T[] => {
  if (!envVar) return defaultValues;

  const values = envVar
    .split(',')
    .filter((item) => expectedValues.includes(item as T)) as T[];

  return values.length > 0 ? values : defaultValues;
};
