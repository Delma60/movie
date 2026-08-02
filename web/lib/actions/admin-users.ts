"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasRole, type UserRole } from "@/lib/roles";

const ASSIGNABLE_ROLES: UserRole[] = ["user", "editor", "admin"];

/**
 * Re-checks the actor's role straight from the DB rather than trusting the
 * session JWT's role claim. This action mutates other users' permissions,
 * so it gets the stricter, live check — a token minted before a demotion
 * would otherwise still say "admin" until the actor logs in again.
 */
async function requireAdminActor() {
  const session = await getSession();
  if (!session?.email) throw new Error("Not signed in.");

  const [actor] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, session.email))
    .limit(1);

  if (!actor || !hasRole(actor.role, "admin")) {
    throw new Error("Admin role required.");
  }

  return actor;
}

export async function listUsers() {
  await requireAdminActor();
  return db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
    })
    .from(users)
    .orderBy(users.createdAt);
}

export async function updateUserRole(targetUserId: string, role: UserRole): Promise<void> {
  const actor = await requireAdminActor();

  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new Error("Invalid role.");
  }
  if (targetUserId === actor.id && role !== "admin") {
    // Simple guardrail so an admin can't fat-finger their own account into
    // a lockout. Doesn't check whether they're the *last* admin — if that
    // matters for your deployment, add a count check here.
    throw new Error("You can't demote your own account.");
  }

  await db.update(users).set({ role }).where(eq(users.id, targetUserId));
  revalidatePath("/admin/users");
}