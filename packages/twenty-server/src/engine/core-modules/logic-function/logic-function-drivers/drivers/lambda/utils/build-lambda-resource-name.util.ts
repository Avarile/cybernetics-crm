import { isNonEmptyString } from '@sniptt/guards';

// Builds a Lambda resource name from a prefix, optional namespace, and checksum.
export const buildLambdaResourceName = ({
  resourceNamePrefix,
  namespace,
  checksum,
}: {
  resourceNamePrefix: string;
  namespace?: string;
  checksum: string;
}): string =>
  isNonEmptyString(namespace)
    ? `${resourceNamePrefix}-${namespace}-${checksum}`
    : `${resourceNamePrefix}-${checksum}`;
