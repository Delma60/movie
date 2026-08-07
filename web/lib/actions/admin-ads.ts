"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, titles, users } from "@/lib/db/schema";
import { logAdminAction } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { AdPlacement } from "@/lib/db/schema";

const VALID_PLACEMENTS: AdPlacement[] = ["homepage", "title_page", "browse"];

async function requireAdminActor() {
  const session = await getSession();
  if (!session?.email) throw new Error("Not signed in.");

  const [actor] = await db
    .select({ id: users.id, role: users.role, displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.email, session.email))
    .limit(1);

  if (!actor || !hasRole(actor.role, "admin")) {
    throw new Error("Admin role required.");
  }

  return actor;
}

export async function createAd(formData: FormData): Promise<void> {
  const actor = await requireAdminActor();

  const headline = String(formData.get("headline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const placement = String(formData.get("placement") ?? "homepage") as AdPlacement;
  const titleId = String(formData.get("titleId") ?? "").trim() || null;
  const ctaText = String(formData.get("ctaText") ?? "").trim();
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!headline || !ctaText || !ctaUrl) {
    redirect("/admin/ads/new?error=missing_fields");
  }

  if (!VALID_PLACEMENTS.includes(placement)) {
    redirect("/admin/ads/new?error=invalid_placement");
  }

  if (!/^https?:\/\//.test(ctaUrl)) {
    redirect("/admin/ads/new?error=invalid_url");
  }

  if (titleId) {
    const [title] = await db
      .select({ id: titles.id })
      .from(titles)
      .where(eq(titles.id, titleId))
      .limit(1);

    if (!title) {
      redirect("/admin/ads/new?error=invalid_title");
    }
  }

  const [created] = await db.insert(ads).values({
    headline,
    description,
    placement,
    titleId: titleId || null,
    ctaText,
    ctaUrl,
    active,
  }).returning({ id: ads.id });

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "ad.created",
    targetType: "ad",
    targetId: created.id,
    targetLabel: headline,
    metadata: { placement, active, titleId: titleId || null },
  });

  revalidatePath("/admin/ads");
  redirect("/admin/ads?created=1");
}

export async function toggleAdActive(adId: string, active: boolean): Promise<void> {
  const actor = await requireAdminActor();

  const [ad] = await db.select({ headline: ads.headline }).from(ads).where(eq(ads.id, adId)).limit(1);
  await db.update(ads).set({ active }).where(eq(ads.id, adId));

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "ad.active_toggled",
    targetType: "ad",
    targetId: adId,
    targetLabel: ad?.headline ?? null,
    metadata: { active },
  });

  revalidatePath("/admin/ads");
}
