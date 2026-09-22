import { type FetchedCalendarEvent } from 'src/modules/calendar/common/types/fetched-calendar-event';

// Builds a placeholder FetchedCalendarEvent representing a CalDAV event that
// was deleted server-side, so downstream sync can mark it cancelled.
export const buildCancelledCalDavEvent = (
  href: string,
): FetchedCalendarEvent => ({
  id: href,
  title: '',
  iCalUid: '',
  description: '',
  startsAt: '',
  endsAt: '',
  location: '',
  isFullDay: false,
  isCanceled: true,
  conferenceLinkLabel: '',
  conferenceLinkUrl: '',
  externalCreatedAt: '',
  externalUpdatedAt: '',
  conferenceSolution: '',
  participants: [],
  status: 'CANCELLED',
});
