import { ConnectedAccountProvider } from 'twenty-shared/types';

// Only Google, Microsoft, and CalDAV accounts support creating calendar events.
export const isCalendarCreationSupportedProvider = (
  provider: ConnectedAccountProvider,
): boolean =>
  provider === ConnectedAccountProvider.GOOGLE ||
  provider === ConnectedAccountProvider.MICROSOFT ||
  provider === ConnectedAccountProvider.IMAP_SMTP_CALDAV;
