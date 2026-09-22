// Parses raw stdout/stderr log text from logic function execution into
// structured, timestamp/level/message log lines.
import { type ParsedLogLine } from 'src/engine/core-modules/event-logs/producers/application-log/parsed-log-line.type';
import { stripAnsiEscapes } from 'src/engine/core-modules/event-logs/producers/application-log/strip-ansi-escapes.util';

// Matches: 2024-01-01T00:00:00.000Z INFO some message
const LOG_LINE_REGEX =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(INFO|ERROR|WARN|DEBUG)\s+(.*)$/;

// Splits raw log text into lines, parsing the `<timestamp> <LEVEL> <message>`
// format when present and falling back to INFO/now for unstructured lines.
export const parseApplicationLogLines = (rawLogs: string): ParsedLogLine[] => {
  if (!rawLogs) {
    return [];
  }

  const lines = rawLogs.split('\n').filter(Boolean);

  return lines.map((line) => {
    const match = line.match(LOG_LINE_REGEX);

    if (match) {
      return {
        timestamp: new Date(match[1]),
        level: match[2],
        message: stripAnsiEscapes(match[3]),
      };
    }

    return {
      timestamp: new Date(),
      level: 'INFO',
      message: stripAnsiEscapes(line),
    };
  });
};
