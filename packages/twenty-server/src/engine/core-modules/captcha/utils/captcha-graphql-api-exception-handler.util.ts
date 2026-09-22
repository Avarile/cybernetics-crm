// Maps CaptchaException codes to GraphQL API errors.
import { assertUnreachable } from 'twenty-shared/utils';

import {
  type CaptchaException,
  CaptchaExceptionCode,
} from 'src/engine/core-modules/captcha/captcha.exception';
import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';

// Maps a CaptchaException code to the corresponding GraphQL API error class.
export const captchaGraphqlApiExceptionHandler = (
  exception: CaptchaException,
) => {
  switch (exception.code) {
    case CaptchaExceptionCode.INVALID_CAPTCHA:
      throw new UserInputError(exception);

    default: {
      assertUnreachable(exception.code);
    }
  }
};
