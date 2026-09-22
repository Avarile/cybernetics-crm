// Provider-agnostic classification of a mail folder's role, used to
// consistently identify the inbox/drafts/sent/trash/junk folder across
// Gmail, Microsoft and IMAP accounts.
export enum StandardFolder {
  INBOX = 'inbox',
  DRAFTS = 'drafts',
  SENT = 'sent',
  TRASH = 'trash',
  JUNK = 'junk',
}
