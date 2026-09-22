import { inspect } from 'util';

import { msg } from '@lingui/core/macro';
import { isDate, isNull, isString } from '@sniptt/guards';
import { isValid, parse } from 'date-fns';
import { ACCEPTED_DATE_TIME_FORMATS } from 'twenty-shared/utils';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';

// True when the string matches one of the date-time formats twenty-shared
// accepts as valid input for a DATE_TIME filter.
const isValidDateTimeFormat = (value: string): boolean => {
  for (const format of ACCEPTED_DATE_TIME_FORMATS) {
    const parsed = parse(value, format, new Date());

    if (isValid(parsed)) {
      return true;
    }
  }

  return false;
};

// Validates a DATE_TIME filter value: null passes through, a Date instance
// or a recognized date-time-format string is accepted; throws otherwise.
export const validateDateTimeFieldOrThrow = (
  value: unknown,
  fieldName: string,
): unknown => {
  if (isNull(value)) return null;

  if (isDate(value) && isValid(value)) {
    return value;
  }

  if (isString(value) && isValidDateTimeFormat(value)) {
    return value;
  }

  const inspectedValue = inspect(value);

  throw new CommonQueryRunnerException(
    `Invalid value ${inspectedValue} for date-time field "${fieldName}". Expected format: 'YYYY-MM-DDTHH:mm:ssZ'`,
    CommonQueryRunnerExceptionCode.INVALID_ARGS_FILTER,
    {
      userFriendlyMessage: msg`Invalid value for date-time: "${inspectedValue}". Expected format: 'YYYY-MM-DDTHH:mm:ssZ'`,
    },
  );
};
