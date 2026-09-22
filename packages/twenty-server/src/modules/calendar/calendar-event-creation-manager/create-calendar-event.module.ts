import { Module } from '@nestjs/common';

import { ConnectedAccountMetadataModule } from 'src/engine/metadata-modules/connected-account/connected-account-metadata.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { CalendarEventCreationManagerModule } from 'src/modules/calendar/calendar-event-creation-manager/calendar-event-creation-manager.module';
import { CreateCalendarEventResolver } from 'src/modules/calendar/calendar-event-creation-manager/resolvers/create-calendar-event.resolver';

// Exposes the GraphQL resolver for creating a calendar event on a connected account.
@Module({
  imports: [
    CalendarEventCreationManagerModule,
    ConnectedAccountMetadataModule,
    PermissionsModule,
  ],
  providers: [CreateCalendarEventResolver],
})
export class CreateCalendarEventModule {}
