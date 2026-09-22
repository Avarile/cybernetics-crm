import { msg } from '@lingui/core/macro';

import { type FilterOperator } from 'src/engine/api/common/common-args-processors/filter-arg-processor/types/filter-operator.type';
import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';

// Throws unless the value is an array, for operators like "in" that
// require an array value.
export const validateArrayOperatorValueOrThrow = (
  value: unknown,
  operator: FilterOperator,
  fieldName: string,
): void => {
  if (!Array.isArray(value)) {
    throw new CommonQueryRunnerException(
      `Filter operator "${operator}" requires an array value for field ${fieldName}`,
      CommonQueryRunnerExceptionCode.INVALID_ARGS_FILTER,
      {
        userFriendlyMessage: msg`Invalid filter: "${operator}" operator requires an array`,
      },
    );
  }
};
