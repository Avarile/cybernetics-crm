import { type TotpContext } from './totp/constants/totp.strategy.constants';

// Lifecycle of an OTP method: PENDING until the user verifies it once, then VERIFIED
export enum OTPStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
}

export type OTPContext = TotpContext;
