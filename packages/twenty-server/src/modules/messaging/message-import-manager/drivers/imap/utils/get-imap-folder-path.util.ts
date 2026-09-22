import { isNonEmptyString } from '@sniptt/guards';

// Strips a trailing ":<uidValidity>" suffix (added when the folder's
// UIDVALIDITY was known) from a folder's externalId to get its IMAP path.
export const getImapFolderPath = (
  externalId: string | null | undefined,
): string | null => {
  if (!isNonEmptyString(externalId)) {
    return null;
  }

  const lastColonIndex = externalId.lastIndexOf(':');

  if (lastColonIndex === -1) {
    return externalId;
  }

  const trailingSegment = externalId.slice(lastColonIndex + 1);

  if (!/^\d+$/.test(trailingSegment)) {
    return externalId;
  }

  return externalId.slice(0, lastColonIndex);
};
