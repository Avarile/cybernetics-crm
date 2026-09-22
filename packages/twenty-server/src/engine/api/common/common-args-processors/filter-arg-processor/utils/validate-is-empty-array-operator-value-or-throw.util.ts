import { msg } from '@lingui/core/macro';
import { isBoolean } from 'class-validator';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';

// Throws unless the value is a boolean, as required by the isEmptyArray
// operator.
export const validateIsEmptyArrayOperatorValueOrThrow = (
  value: unknown,
  fieldName: string,
): void => {
  if (!isBoolean(value)) {
    throw new CommonQueryRunnerException(
      `Filter operator "isEmptyArray" requires a boolean value for field ${fieldName}`,
      CommonQueryRunnerExceptionCode.INVALID_ARGS_FILTER,
      {
        userFriendlyMessage: msg`Invalid filter: "isEmptyArray" operator requires a boolean`,
      },
    );
  }
};
