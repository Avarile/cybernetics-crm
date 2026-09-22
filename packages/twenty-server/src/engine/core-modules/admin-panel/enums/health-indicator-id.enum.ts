import { registerEnumType } from '@nestjs/graphql';

// Identifiers for each system component checked by the admin panel health service
export enum HealthIndicatorId {
  database = 'database',
  redis = 'redis',
  worker = 'worker',
  connectedAccount = 'connectedAccount',
  app = 'app',
}

registerEnumType(HealthIndicatorId, {
  name: 'HealthIndicatorId',
});
