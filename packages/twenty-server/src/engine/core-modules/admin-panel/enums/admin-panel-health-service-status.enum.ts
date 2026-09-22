import { registerEnumType } from '@nestjs/graphql';

// GraphQL-exposed overall status of a monitored admin panel health service
export enum AdminPanelHealthServiceStatus {
  OPERATIONAL = 'OPERATIONAL',
  OUTAGE = 'OUTAGE',
}

registerEnumType(AdminPanelHealthServiceStatus, {
  name: 'AdminPanelHealthServiceStatus',
});
