import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, type SessionUser } from "@/lib/session";

/**
 * Shared secret the mobile app embeds and sends on every request. This is
 * NOT user auth — it's what keeps `/api/v1/**` from being a public API
 * anyone can discover and hit. Per-user auth is the bearer session token
 * checked separately via `requireAuth`.
 */
function checkClientKey(req: NextRequest): boolean {
  const expected = process.env.MOBILE_API_KEY;
  if (!expected) {
    // Fail closed once this is meant to matter. Only lets requests through
    // when the var is genuinely unset AND we're not in production, so
    // `npm run dev` doesn't break for anyone who hasn't wired it up yet.
    // MOBILE_API_KEY must be set in every deployed environment.
    return process.env.NODE_ENV !== "production";
  }
  return req.headers.get("x-velvet-client-key") === expected;
}

async function getBearerSession(req: NextRequest): Promise<SessionUser | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifySessionToken(header.slice(7).trim());
}

export function jsonError(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

interface ApiContext<P> {
  session: SessionUser | null;
  params: P;
}

type RouteContext<P> = { params: Promise<P> };

/**
 * Wraps a `/api/v1/**` handler with the client-key check and, optionally,
 * bearer-token session auth. Dynamic route params are pre-awaited so
 * handlers don't each need to do it themselves.
 */
export function apiRoute<P = Record<string, string>>(
  handler: (req: NextRequest, ctx: ApiContext<P>) => Promise<Response>,
  opts: { requireAuth?: boolean } = {},
) {
  return async (req: NextRequest, context?: RouteContext<P>) => {
    if (!checkClientKey(req)) return jsonError("invalid_client", 401);

    const session = await getBearerSession(req);
    if (opts.requireAuth && !session) return jsonError("unauthorized", 401);

    const params = context ? await context.params : ({} as P);
    return handler(req, { session, params });
  };
}
