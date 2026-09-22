import { msg } from '@lingui/core/macro';
import { isNull } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { validateTextFieldOrThrow } from 'src/engine/api/common/common-args-processors/data-arg-processor/validator-utils/validate-text-field-or-throw.util';
import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { STANDARD_ERROR_MESSAGE } from 'src/engine/api/common/common-query-runners/errors/standard-error-message.constant';

// Validates a RATING or SELECT field input against the field's configured
// options, requiring options to be provided and the value to be one of
// them (or null); throws a CommonQueryRunnerException otherwise.
export const validateRatingAndSelectFieldOrThrow = (
  value: unknown,
  fieldName: string,
  options?: string[],
): string | null => {
  const preValidatedValue = validateTextFieldOrThrow(value, fieldName);

  if (!isDefined(options)) {
    throw new CommonQueryRunnerException(
      `Invalid options for field "${fieldName}"`,
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
    );
  }

  if (!isNull(preValidatedValue) && !options.includes(preValidatedValue)) {
    throw new CommonQueryRunnerException(
      `Invalid value "${preValidatedValue}" for field "${fieldName}". Valid values are: ${options.join(', ')}`,
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      {
        userFriendlyMessage: msg`Invalid value for field "${fieldName}"`,
      },
    );
  }

  return preValidatedValue;
};
