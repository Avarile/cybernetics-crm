import type { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

// Adapts a plain access token into the Graph SDK's AuthenticationProvider interface.
export class MicrosoftOAuth2ClientAuthProvider implements AuthenticationProvider {
  constructor(private readonly accessToken: string) {}

  public async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}
