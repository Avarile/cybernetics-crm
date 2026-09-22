import { Module } from '@nestjs/common';

import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { GoogleCalendarGetEventsService } from 'src/modules/calendar/calendar-event-import-manager/drivers/google-calendar/services/google-calendar-get-events.service';
import { GoogleCalendarImportEventsService } from 'src/modules/calendar/calendar-event-import-manager/drivers/google-calendar/services/google-calendar-import-events.service';
import { OAuth2ClientManagerModule } from 'src/modules/connected-account/oauth2-client-manager/oauth2-client-manager.module';

// Wires up the Google Calendar import driver's get/import-events services.
@Module({
  imports: [TwentyConfigModule, OAuth2ClientManagerModule],
  providers: [
    GoogleCalendarGetEventsService,
    GoogleCalendarImportEventsService,
  ],
  exports: [GoogleCalendarGetEventsService, GoogleCalendarImportEventsService],
})
export class GoogleCalendarDriverModule {}
