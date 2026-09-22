import { isDefined } from 'twenty-shared/utils';

import { STANDARD_ERROR_MESSAGE } from 'src/engine/api/common/common-query-runners/errors/standard-error-message.constant';
import { type CommonSelectedFields } from 'src/engine/api/common/types/common-selected-fields-result.type';
import {
  RestInputRequestParserException,
  RestInputRequestParserExceptionCode,
} from 'src/engine/api/rest/input-request-parsers/rest-input-request-parser.exception';
import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';

// Parses the `?aggregate=[...]` REST query param (a JSON array of
// aggregate field keys) into a select-fields map; throws on malformed
// JSON or a non-array-string value.
export const parseAggregateFieldsRestRequest = (
  request: AuthenticatedRequest,
): CommonSelectedFields => {
  const aggregateFieldsQuery = request.query.aggregate;

  if (!isDefined(aggregateFieldsQuery)) return {};

  if (typeof aggregateFieldsQuery !== 'string') {
    throw new RestInputRequestParserException(
      `Invalid aggregate query parameter - should be a valid array of string - ex: ["countNotEmptyId", "countEmptyField"]`,
      RestInputRequestParserExceptionCode.INVALID_AGGREGATE_FIELDS_QUERY_PARAM,
      { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
    );
  }

  try {
    const aggregateFields = JSON.parse(aggregateFieldsQuery);

    return aggregateFields.reduce(
      (acc: CommonSelectedFields, field: string) => {
        acc[field] = true;

        return acc;
      },
      {},
    );
  } catch {
    throw new RestInputRequestParserException(
      `Invalid aggregate query parameter - should be a valid array of string - ex: ["countNotEmptyId", "countEmptyField"]`,
      RestInputRequestParserExceptionCode.INVALID_AGGREGATE_FIELDS_QUERY_PARAM,
      { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
    );
  }
};
