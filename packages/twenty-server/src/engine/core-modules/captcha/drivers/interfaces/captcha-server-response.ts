// Shape of the JSON response returned by reCAPTCHA/Turnstile siteverify APIs.
export type CaptchaServerResponse = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  'error-codes': string[];
};
