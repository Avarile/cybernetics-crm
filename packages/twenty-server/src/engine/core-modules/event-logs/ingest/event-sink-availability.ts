export const KNOWN_SINK_NAMES = ['clickhouse', 'console'] as const;

// Filters configured sink names down to those actually usable (e.g. the
// clickhouse sink requires CLICKHOUSE_URL to be set).
export const getAvailableSinkNames = (
  configuredSinkNames: string[],
  { hasClickhouseUrl }: { hasClickhouseUrl: boolean },
): string[] =>
  configuredSinkNames.filter((name) => {
    const lowerCasedName = name.toLowerCase();

    if (lowerCasedName === 'clickhouse') {
      return hasClickhouseUrl;
    }

    if (lowerCasedName === 'console') {
      return true;
    }

    return false;
  });
