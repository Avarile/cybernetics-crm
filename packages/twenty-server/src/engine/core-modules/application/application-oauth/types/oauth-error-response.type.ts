// Shape of an OAuth 2.0 error response body (RFC 6749 §5.2).
export type OAuthErrorResponse = {
  error: string;
  error_description: string;
};
