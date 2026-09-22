// GraphQL exception filter mapping CaptchaException to the appropriate
// user-facing GraphQL error.
import { Catch, type ExceptionFilter } from '@nestjs/common';

import { CaptchaException } from 'src/engine/core-modules/captcha/captcha.exception';
import { captchaGraphqlApiExceptionHandler } from 'src/engine/core-modules/captcha/utils/captcha-graphql-api-exception-handler.util';

@Catch(CaptchaException)
export class CaptchaGraphqlApiExceptionFilter implements ExceptionFilter {
  // Delegates to captchaGraphqlApiExceptionHandler for the actual mapping.
  catch(exception: CaptchaException) {
    return captchaGraphqlApiExceptionHandler(exception);
  }
}
