import { type FieldValue } from 'src/engine/api/rest/core/types/field-value.type';
import { addDefaultConjunctionIfMissing } from 'src/engine/api/rest/input-request-parsers/filter-parser-utils/add-default-conjunction.util';
import { checkFilterQuery } from 'src/engine/api/rest/input-request-parsers/filter-parser-utils/check-filter-query.util';
import { parseFilter } from 'src/engine/api/rest/input-request-parsers/filter-parser-utils/parse-filter.util';
import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';

// Parses the `?filter=` REST query param into an ObjectRecordFilter-shaped
// object, validating bracket balance and defaulting a missing root
// conjunction to `and`.
export const parseFilterRestRequest = (
  request: AuthenticatedRequest,
): Record<string, FieldValue> => {
  let filterQuery = request.query.filter;

  if (typeof filterQuery !== 'string') {
    return {};
  }

  checkFilterQuery(filterQuery);

  filterQuery = addDefaultConjunctionIfMissing(filterQuery);

  return parseFilter(filterQuery);
};
