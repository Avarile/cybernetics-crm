// Shared captcha types: the supported driver types (GraphQL enum), the
// options a driver is constructed with, and its validation result shape.
import { registerEnumType } from '@nestjs/graphql';

export enum CaptchaDriverType {
  GOOGLE_RECAPTCHA = 'GOOGLE_RECAPTCHA',
  TURNSTILE = 'TURNSTILE',
}

registerEnumType(CaptchaDriverType, {
  name: 'CaptchaDriverType',
});

export type CaptchaDriverOptions = {
  siteKey: string;
  secretKey: string;
};

export type CaptchaValidateResult = { success: boolean; error?: string };
