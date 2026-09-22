import { createHash } from 'crypto';

import { isNonEmptyString } from '@sniptt/guards';

const RESOURCE_NAMESPACE_LENGTH = 10;
const NO_ROLE_SENTINEL = 'no-role';

// Derives a short namespace from the Lambda role ARN, so shared resources
// (layers, tool Lambdas) don't collide across differently-configured instances.
export const getLambdaResourceNamespace = ({
  lambdaRoleArn,
}: {
  lambdaRoleArn?: string;
}): string =>
  createHash('sha256')
    .update(isNonEmptyString(lambdaRoleArn) ? lambdaRoleArn : NO_ROLE_SENTINEL)
    .digest('hex')
    .slice(0, RESOURCE_NAMESPACE_LENGTH);
