import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getOidcClient } from "@/lib/spurs";

export async function GET(req: NextRequest) {
  const oidc = getOidcClient();
  const { url, state, codeVerifier } = await oidc.createAuthorizationUrl();
  const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/";

  const store = await cookies();
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/auth",
  };

  store.set("spurs_oauth_state", state, opts);
  store.set("spurs_oauth_verifier", codeVerifier, opts);
  store.set("spurs_oauth_return_to", returnTo, opts);

  return NextResponse.redirect(url);
}
