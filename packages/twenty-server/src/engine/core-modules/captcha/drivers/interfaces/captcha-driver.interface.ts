// Common interface implemented by every captcha driver.
import { type CaptchaValidateResult } from 'src/engine/core-modules/captcha/interfaces';

export interface CaptchaDriver {
  validate(token: string): Promise<CaptchaValidateResult>;
}
