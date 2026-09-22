import { isNonEmptyString } from '@sniptt/guards';

import { type FetchedCalendarEvent } from 'src/modules/calendar/common/types/fetched-calendar-event';

// Checks whether an event's start/end interval overlaps the given window.
export const isEventInTimeRange = (
  event: FetchedCalendarEvent,
  windowStart: Date,
  windowEnd: Date,
): boolean => {
  if (!isNonEmptyString(event.startsAt) || !isNonEmptyString(event.endsAt))
    return false;

  const eventStart = new Date(event.startsAt);
  const eventEnd = new Date(event.endsAt);

  return eventStart < windowEnd && eventEnd > windowStart;
};
