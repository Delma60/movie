"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, subscriptions, users } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { SubscriptionStatus } from "@/lib/db/schema";

const VALID_STATUSES: SubscriptionStatus[] = [
  "active",
  "past_due",
  "canceled",
  "trialing",
];

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

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus,
): Promise<void> {
  await requireAdminActor();

  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid subscription status.");
  }

  await db
    .update(subscriptions)
    .set({ status })
    .where(eq(subscriptions.id, subscriptionId));

  revalidatePath("/admin/subscriptions");
}

export async function createSubscription(formData: FormData): Promise<void> {
  await requireAdminActor();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const plan = String(formData.get("plan") ?? "").trim();
  const status = String(formData.get("status") ?? "active") as SubscriptionStatus;
  const currentPeriodEndRaw = String(formData.get("currentPeriodEnd") ?? "").trim();

  if (!email || !plan) {
    redirect("/admin/subscriptions/new?error=missing_fields");
  }
  if (!VALID_STATUSES.includes(status)) {
    redirect("/admin/subscriptions/new?error=invalid_status");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/subscriptions/new?error=invalid_email");
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    redirect(`/admin/subscriptions/new?error=unknown_user&email=${encodeURIComponent(email)}`);
  }

  let currentPeriodEnd: Date | null = null;
  if (currentPeriodEndRaw) {
    currentPeriodEnd = new Date(currentPeriodEndRaw);
    if (Number.isNaN(currentPeriodEnd.getTime())) {
      redirect("/admin/subscriptions/new?error=invalid_date");
    }
  }

  await db.insert(subscriptions).values({
    userId: user.id,
    plan,
    status,
    currentPeriodEnd,
  });

  revalidatePath("/admin/subscriptions");
  redirect("/admin/subscriptions?created=1");
}
