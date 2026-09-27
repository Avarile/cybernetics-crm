import { cleanServerUrl } from 'src/utils/clean-server-url';

export const getServerUrl = ({
  serverUrlEnv,
  serverUrlFallback,
}: {
  serverUrlEnv?: string;
  serverUrlFallback: string;
}): string => {
  // cleanServerUrl passes through undefined, so an unset env var falls back.
  return cleanServerUrl(serverUrlEnv) || serverUrlFallback;
};
