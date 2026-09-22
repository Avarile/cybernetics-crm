// Shape of a successful OAuth 2.0 token response body (RFC 6749 §5.1).
export type OAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};
