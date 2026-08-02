import { createOidcClient } from "@spurs-cloud/accounts";

let cached: ReturnType<typeof createOidcClient> | undefined;

/**
 * Velvet is a third-party Spurs app. It uses the OAuth2/OIDC authorization-code
 * flow with PKCE so it appears in the user's Connected apps and can request
 * its own access token from Spurs Accounts.
 */
export function getOidcClient() {
  if (!process.env.SPURS_CLIENT_ID || !process.env.SPURS_CLIENT_SECRET) {
    throw new Error("[velvet] SPURS_CLIENT_ID and SPURS_CLIENT_SECRET must be set");
  }

  cached ??= createOidcClient({
    clientId: process.env.SPURS_CLIENT_ID,
    clientSecret: process.env.SPURS_CLIENT_SECRET,
    redirectUri: `${process.env.APP_URL ?? "http://localhost:3000"}/auth/callback`,
    issuer: process.env.SPURS_ISSUER,
  });

  return cached;
}
