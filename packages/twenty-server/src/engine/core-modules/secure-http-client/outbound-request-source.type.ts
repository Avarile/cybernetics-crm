// Feature areas that can initiate an outbound HTTP request through the
// secure HTTP client.
export type OutboundRequestSource =
  | 'webhook'
  | 'workflow-http'
  | 'logic-function'
  | 'database-centre';
