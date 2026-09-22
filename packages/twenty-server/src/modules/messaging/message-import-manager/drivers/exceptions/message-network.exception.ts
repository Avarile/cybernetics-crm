// Low-level network error codes (Node/Axios) recognized when classifying
// import driver failures as transient network errors.
export enum MessageNetworkExceptionCode {
  ECONNREFUSED = 'ECONNREFUSED',
  ECONNRESET = 'ECONNRESET',
  ENOTFOUND = 'ENOTFOUND',
  ECONNABORTED = 'ECONNABORTED',
  ETIMEDOUT = 'ETIMEDOUT',
  ERR_NETWORK = 'ERR_NETWORK',
  EHOSTUNREACH = 'EHOSTUNREACH',
}
