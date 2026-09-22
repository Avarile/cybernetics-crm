// Generic shape of a Microsoft Graph $batch response, parameterized by
// each sub-response's body type.
export type MicrosoftGraphBatchResponse<TBody> = {
  responses: {
    id: string;
    status: number;
    body?: TBody;
  }[];
};
