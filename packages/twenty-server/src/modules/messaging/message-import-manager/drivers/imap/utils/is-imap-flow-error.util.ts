import { isDefined } from 'twenty-shared/utils';

import { type ImapFlowError } from 'src/modules/messaging/message-import-manager/drivers/imap/types/imap-error.type';

// Type guard: true when the error carries any of the extra fields ImapFlow
// attaches (as opposed to a plain Error or Node network error).
export const isImapFlowError = (error: Error): error is ImapFlowError => {
  return (
    isDefined(error) &&
    ('serverResponseCode' in error ||
      'responseText' in error ||
      'executedCommand' in error ||
      'authenticationFailed' in error)
  );
};
