import { inspect } from 'util';

import { msg } from '@lingui/core/macro';
import { isNull } from '@sniptt/guards';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';

// Validates an array field input: null passes through, a single string is
// allowed, otherwise it must be an array of strings; throws otherwise.
export const validateArrayFieldOrThrow = (
  value: unknown,
  fieldName: string,
): string | string[] | null => {
  if (isNull(value)) return null;

  if (typeof value === 'string') return value;

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    const inspectedValue = inspect(value);

    throw new CommonQueryRunnerException(
      `Invalid value ${inspectedValue} for field "${fieldName} - Array values need to be string"`,
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      { userFriendlyMessage: msg`Invalid value: "${inspectedValue}"` },
    );
  }

  return value;
};
