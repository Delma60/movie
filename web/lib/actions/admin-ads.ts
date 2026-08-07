"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, titles, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { AdPlacement } from "@/lib/db/schema";

const VALID_PLACEMENTS: AdPlacement[] = ["homepage", "title_page", "browse"];

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

export async function createAd(formData: FormData): Promise<void> {
  await requireAdminActor();

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

  await db.insert(ads).values({
    headline,
    description,
    placement,
    titleId: titleId || null,
    ctaText,
    ctaUrl,
    active,
  });

  revalidatePath("/admin/ads");
  redirect("/admin/ads?created=1");
}

export async function toggleAdActive(adId: string, active: boolean): Promise<void> {
  await requireAdminActor();

  await db
    .update(ads)
    .set({ active })
    .where(eq(ads.id, adId));

  revalidatePath("/admin/ads");
}
