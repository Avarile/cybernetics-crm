// Shared helpers for the setup-db/truncate-db CLI scripts.
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';

export const camelToSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// Runs a raw SQL query against the raw data source, logging success/failure to the
// console. Can optionally treat an "already exists" error as a success (idempotent DDL).
export const performQuery = async <T = unknown>(
  query: string,
  consoleDescription: string,
  withLog = true,
  ignoreAlreadyExistsError = false,
) => {
  try {
    const result = await rawDataSource.query<T>(query);

    if (withLog) {
      // oxlint-disable-next-line no-console
      console.log(`Performed '${consoleDescription}' successfully`);
    }

    return result;
  } catch (err) {
    let message = '';

    if (ignoreAlreadyExistsError && `${err}`.includes('already exists')) {
      message = `Performed '${consoleDescription}' successfully`;
    } else {
      message = `Failed to perform '${consoleDescription}': ${err}`;
    }
    if (withLog) {
      // oxlint-disable-next-line no-console
      console.error(message);
    }
  }
};
