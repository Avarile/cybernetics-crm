// Provider-agnostic shape import drivers normalize raw calendar events/participants
// into before they're persisted as workspace records.
export type FetchedCalendarEventParticipant = {
  displayName: string;
  responseStatus: string;
  handle: string;
  isOrganizer: boolean;
};

export type FetchedCalendarEvent = {
  id: string;
  title: string;
  iCalUid: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  isFullDay: boolean;
  isCanceled: boolean;
  conferenceLinkLabel: string;
  conferenceLinkUrl: string;
  externalCreatedAt: string;
  externalUpdatedAt: string;
  conferenceSolution: string;
  recurringEventExternalId?: string;
  participants: FetchedCalendarEventParticipant[];
  status: string;
};
