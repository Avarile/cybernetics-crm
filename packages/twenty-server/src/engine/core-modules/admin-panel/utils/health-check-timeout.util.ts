import { HEALTH_INDICATORS_TIMEOUT } from 'src/engine/core-modules/admin-panel/constants/health-indicators-timeout.conts';

// Races a health-check promise against a fixed timeout, rejecting with
// errorMessage if the check takes too long.
export const withHealthCheckTimeout = async <T>(
  promise: Promise<T>,
  errorMessage: string,
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(errorMessage)),
        HEALTH_INDICATORS_TIMEOUT,
      ),
    ),
  ]);
};
