import { inspect } from 'util';

import { msg } from '@lingui/core/macro';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';

// Validates a manually-overridden position value: must be a finite number
// (not NaN or +/-Infinity); throws a CommonQueryRunnerException otherwise.
export const validateOverriddenPositionFieldOrThrow = (
  value: unknown,
  fieldName: string,
): number | null => {
  if (
    typeof value !== 'number' ||
    (typeof value === 'number' &&
      (isNaN(value) || value === Infinity || value === -Infinity))
  ) {
    const inspectedValue = inspect(value);

    throw new CommonQueryRunnerException(
      `Invalid position value ${inspectedValue} for field "${fieldName}"`,
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      {
        userFriendlyMessage: msg`Invalid value for position: "${inspectedValue}"`,
      },
    );
  }

  return value;
};
