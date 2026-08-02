import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getOidcClient } from "@/lib/spurs";
import { issueSessionToken, SESSION_COOKIE } from "@/lib/session";
import { db, users } from "@/lib/db";
import { resolveInitialRole } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL ?? req.nextUrl.origin;
  const store = await cookies();

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = store.get("spurs_oauth_state")?.value;
  const codeVerifier = store.get("spurs_oauth_verifier")?.value;
  const returnTo = store.get("spurs_oauth_return_to")?.value ?? "/";

  store.delete("spurs_oauth_state");
  store.delete("spurs_oauth_verifier");
  store.delete("spurs_oauth_return_to");

  if (req.nextUrl.searchParams.get("error")) {
    return NextResponse.redirect(`${appUrl}/login?error=access_denied`);
  }

  if (!code || !state || !codeVerifier || state !== savedState) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  try {
    const oidc = getOidcClient();
    const { user } = await oidc.handleCallback(code, codeVerifier);
    if (!user.email) throw new Error("Spurs account has no verified email");

    // Resolve (or create) the app's own user row so the session carries our
    // user id and current role — not just the raw Spurs claims. This also
    // fixes the session `sub` to match the app's users.id, same as the
    // password-login path, instead of the external Spurs subject.
    const [existing] = await db
      .select({ id: users.id, role: users.role, displayName: users.displayName })
      .from(users)
      .where(eq(users.email, user.email))
      .limit(1);

    const appUser =
      existing ??
      (
        await db
          .insert(users)
          .values({
            email: user.email,
            displayName: user.name ?? user.email,
            role: resolveInitialRole(user.email),
          })
          .returning({ id: users.id, role: users.role, displayName: users.displayName })
      )[0];

    const token = await issueSessionToken({
      sub: appUser.id,
      name: appUser.displayName,
      email: user.email,
      role: appUser.role,
    });

    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch (error) {
    console.error("[auth/callback]", error instanceof Error ? error.message : error);
    return NextResponse.redirect(`${appUrl}/login?error=exchange_failed`);
  }

  return NextResponse.redirect(`${appUrl}${returnTo}`);
}