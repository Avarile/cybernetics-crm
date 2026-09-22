// Error wrapper carrying a raw Postgres error code alongside its message.
export class PostgresException extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}
