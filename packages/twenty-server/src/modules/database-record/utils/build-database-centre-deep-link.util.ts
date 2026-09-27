import { isNonEmptyString } from '@sniptt/guards';

// Builds a link into the data centre's own UI for a table, or a single
// record of it when recordId is given.
export const buildDatabaseCentreDeepLink = ({
  baseUrl,
  baseId,
  tableId,
  recordId,
  viewId,
}: {
  baseUrl: string;
  baseId: string;
  tableId: string;
  recordId?: string | null;
  viewId?: string | null;
}): string => {
  let url = `${baseUrl.replace(/\/+$/, '')}/base/${encodeURIComponent(baseId)}/table/${encodeURIComponent(tableId)}`;

  if (isNonEmptyString(viewId)) {
    url += `/${encodeURIComponent(viewId)}`;
  }

  if (isNonEmptyString(recordId)) {
    url += `?recordId=${encodeURIComponent(recordId)}`;
  }

  return url;
};
