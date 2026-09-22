// Extracts the offending column name and value out of a Postgres
// constraint-violation error's detail message (e.g. `Key (email)=(x@y.com) already exists.`).
import { type QueryFailedError } from 'typeorm';

export type PostgreSQLError = QueryFailedError & {
  detail?: string;
  driverError?: Error & {
    detail?: string;
  };
};

export type ParsedConstraintError = {
  columnName: string;
  conflictingValue: string;
};

// Parses the "Key (col)=(val)" pattern from a Postgres error's detail
// string, returning null if the detail is missing or doesn't match.
export const parsePostgresConstraintError = (
  error: PostgreSQLError,
): ParsedConstraintError | null => {
  const errorDetail = error.detail;

  if (!errorDetail) {
    return null;
  }

  const detailMatch = errorDetail.match(/Key \(([^)]+)\)=\(([^)]+)\)/);

  if (!detailMatch) {
    return null;
  }

  const columnName = detailMatch[1].replace(/^["']|["']$/g, '');
  const conflictingValue = detailMatch[2];

  return {
    columnName,
    conflictingValue,
  };
};
