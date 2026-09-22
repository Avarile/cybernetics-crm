// Shape of one page of a Microsoft Graph delta query response.
export type MicrosoftGraphDeltaListResponseBody = {
  value?: { id?: string; '@removed'?: { reason?: string } }[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
  error?: { code?: string; message?: string };
};
