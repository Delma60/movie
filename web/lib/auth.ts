import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from "@/lib/session";
import { hasRole, resolveInitialRole, type UserRole } from "@/lib/roles";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

const APP_USER_COLUMNS = {
  id: users.id,
  email: users.email,
  displayName: users.displayName,
  role: users.role,
};

/**
 * Looks up the app user row behind the current session, lazily creating it
 * if this is the first time we've seen them (covers Spurs users who somehow
 * still only have a bare session — normally auth/callback already creates
 * the row up front so this is a fallback, not the common path).
 */
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const session = await getSession();
  if (!session?.email) return null;

  const [existing] = await db
    .select(APP_USER_COLUMNS)
    .from(users)
    .where(eq(users.email, session.email))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      email: session.email,
      displayName: session.name ?? session.email,
      role: resolveInitialRole(session.email),
    })
    .returning(APP_USER_COLUMNS);

  return created ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentAppUser();
  return user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) redirect("/login?returnTo=/my-list");
  return id;
}

/**
 * Gate a Server Component / layout behind a minimum role, using the role
 * embedded in the session JWT at login time. That makes this cheap enough
 * to call from layouts, but it means a role change doesn't take effect for
 * *this* check until the user logs in again.
 *
 * That staleness window is fine for "should this page render" — worst case
 * a just-demoted user sees the admin shell for a bit longer. It is NOT fine
 * for actions that mutate other users' permissions; those re-check the
 * actor's role straight from the DB instead (see lib/actions/admin-users.ts).
 */
export async function requireRole(required: UserRole, returnTo = "/"): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  if (!hasRole(session.role, required)) redirect("/");
  return session;
}