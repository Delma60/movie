import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import { hasRole } from "@/lib/roles";

const PROTECTED = ["/my-list", "/account"];
const ADMIN_ONLY = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isAdminRoute = ADMIN_ONLY.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const needsAuth =
    isAdminRoute ||
    PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!needsAuth) return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("returnTo", pathname + search);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && !hasRole(session.role, "editor")) {
    // Signed in but not privileged enough — don't hint that the route
    // exists, just bounce them to the homepage.
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/my-list/:path*", "/account/:path*", "/admin/:path*"],
};