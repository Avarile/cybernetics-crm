// A single structured log line parsed from raw application log text.
export type ParsedLogLine = {
  timestamp: Date;
  level: string;
  message: string;
};
