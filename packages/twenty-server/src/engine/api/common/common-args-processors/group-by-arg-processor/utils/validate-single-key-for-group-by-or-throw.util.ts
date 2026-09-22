import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { STANDARD_ERROR_MESSAGE } from 'src/engine/api/common/common-query-runners/errors/standard-error-message.constant';

// Throws with the given message if more than one key was provided, used
// to enforce the "one field per GroupByInput" rule at various nesting
// levels.
export const validateSingleKeyForGroupByOrThrow = ({
  groupByKeys,
  errorMessage,
}: {
  groupByKeys: string[];
  errorMessage: string;
}): void => {
  if (groupByKeys.length > 1) {
    throw new CommonQueryRunnerException(
      errorMessage,
      CommonQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
      { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
    );
  }
};
