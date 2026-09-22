import { type ImapFlow } from 'imapflow';

import { type MailboxState } from './extract-mailbox-state.util';
import { type ImapSyncCursor } from './parse-sync-cursor.util';

// QRESYNC is usable only when the server supports it, both the previous
// cursor and the current mailbox report a MODSEQ, and the folder's
// UIDVALIDITY still matches (or the previous cursor never had one).
export const canUseQresync = (
  client: ImapFlow,
  previousCursor: ImapSyncCursor | null,
  mailboxState: MailboxState,
): boolean => {
  const supportsQresync = client.capabilities.has('QRESYNC');
  const hasModSeq = previousCursor?.modSeq !== undefined;
  const hasServerModSeq = mailboxState.highestModSeq !== undefined;
  const uidValidityMatches =
    (previousCursor?.uidValidity ?? 0) === mailboxState.uidValidity ||
    previousCursor?.uidValidity === 0;

  return supportsQresync && hasModSeq && hasServerModSeq && uidValidityMatches;
};
