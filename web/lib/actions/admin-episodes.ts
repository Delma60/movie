// web/lib/actions/admin-episodes.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, episodes, titles, users } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

/** Same live-role-check pattern as lib/actions/admin-titles.ts — this
 * mutates catalog content, so it re-checks the actor's role from the DB
 * rather than trusting a possibly-stale session JWT. */
async function requireEditorActor() {
  const session = await getSession();
  if (!session?.email) throw new Error("Not signed in.");

  const [actor] = await db
    .select({ id: users.id, role: users.role, displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.email, session.email))
    .limit(1);

  if (!actor || !hasRole(actor.role, "editor")) {
    throw new Error("Editor role required.");
  }

  return actor;
}

export async function createEpisode(formData: FormData): Promise<void> {
  const actor = await requireEditorActor();

  const titleId = String(formData.get("titleId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const synopsis = String(formData.get("synopsis") ?? "").trim() || null;
  const seasonRaw = String(formData.get("season") ?? "").trim();
  const episodeNumberRaw = String(formData.get("episodeNumber") ?? "").trim();
  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();

  // Carries the chosen series back to the form on validation failure so the
  // person doesn't have to re-pick it after fixing a typo elsewhere.
  function fail(code: string): never {
    const params = new URLSearchParams({ error: code });
    if (titleId) params.set("titleId", titleId);
    redirect(`/admin/episodes/new?${params.toString()}`);
  }

  if (!titleId || !name) {
    fail("missing_fields");
  }

  const [series] = await db
    .select({ id: titles.id, type: titles.type })
    .from(titles)
    .where(eq(titles.id, titleId))
    .limit(1);

  if (!series || series.type !== "series") {
    fail("invalid_title");
  }

  const season = Number(seasonRaw || 1);
  if (!Number.isFinite(season) || season < 1) {
    fail("invalid_season");
  }

  const episodeNumber = Number(episodeNumberRaw);
  if (!Number.isFinite(episodeNumber) || episodeNumber < 1) {
    fail("invalid_episode_number");
  }

  let durationMinutes: number | null = null;
  if (durationRaw) {
    durationMinutes = Number(durationRaw);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      fail("invalid_duration");
    }
  }

  const [existing] = await db
    .select({ id: episodes.id })
    .from(episodes)
    .where(
      and(
        eq(episodes.titleId, titleId),
        eq(episodes.season, season),
        eq(episodes.episodeNumber, episodeNumber),
      ),
    )
    .limit(1);

  if (existing) {
    fail("duplicate_episode");
  }

  const [created] = await db
    .insert(episodes)
    .values({
      titleId,
      season,
      episodeNumber,
      name,
      synopsis,
      durationMinutes,
    })
    .returning({ id: episodes.id });

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "episode.created",
    targetType: "episode",
    targetId: created.id,
    targetLabel: name,
    metadata: { titleId, season, episodeNumber },
  });

  revalidatePath("/admin/episodes");
  revalidatePath("/admin/dashboard");
  redirect(`/admin/episodes?created=${created.id}`);
}