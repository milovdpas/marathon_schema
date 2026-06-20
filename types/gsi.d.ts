// Minimal ambient types for the Google Identity Services (GIS) OAuth2 token
// client that we load from https://accounts.google.com/gsi/client.
// Only the surface we actually use is declared.

export {};

declare global {
  interface TokenResponse {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
  }

  interface TokenClientConfig {
    client_id: string;
    scope: string;
    prompt?: "" | "none" | "consent" | "select_account";
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type?: string; message?: string }) => void;
  }

  interface TokenClient {
    requestAccessToken: (overrides?: { prompt?: string }) => void;
  }

  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => TokenClient;
          revoke: (accessToken: string, done?: () => void) => void;
        };
      };
    };
  }
}
