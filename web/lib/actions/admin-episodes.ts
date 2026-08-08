// web/lib/actions/admin-episodes.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
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

export async function updateEpisode(episodeId: string, formData: FormData): Promise<void> {
  const actor = await requireEditorActor();

  const [existing] = await db
    .select({ titleId: episodes.titleId })
    .from(episodes)
    .where(eq(episodes.id, episodeId))
    .limit(1);
  if (!existing) throw new Error("Episode not found.");

  const name = String(formData.get("name") ?? "").trim();
  const synopsis = String(formData.get("synopsis") ?? "").trim() || null;
  const seasonRaw = String(formData.get("season") ?? "").trim();
  const episodeNumberRaw = String(formData.get("episodeNumber") ?? "").trim();
  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();

  function fail(code: string): never {
    redirect(`/admin/episodes/${episodeId}/edit?error=${code}`);
  }

  if (!name) fail("missing_fields");

  const season = Number(seasonRaw || 1);
  if (!Number.isFinite(season) || season < 1) fail("invalid_season");

  const episodeNumber = Number(episodeNumberRaw);
  if (!Number.isFinite(episodeNumber) || episodeNumber < 1) fail("invalid_episode_number");

  let durationMinutes: number | null = null;
  if (durationRaw) {
    durationMinutes = Number(durationRaw);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) fail("invalid_duration");
  }

  const [dup] = await db
    .select({ id: episodes.id })
    .from(episodes)
    .where(
      and(
        eq(episodes.titleId, existing.titleId),
        eq(episodes.season, season),
        eq(episodes.episodeNumber, episodeNumber),
        ne(episodes.id, episodeId),
      ),
    )
    .limit(1);
  if (dup) fail("duplicate_episode");

  await db
    .update(episodes)
    .set({ name, synopsis, season, episodeNumber, durationMinutes })
    .where(eq(episodes.id, episodeId));

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "episode.updated",
    targetType: "episode",
    targetId: episodeId,
    targetLabel: name,
    metadata: { season, episodeNumber },
  });

  revalidatePath("/admin/episodes");
  revalidatePath("/admin/dashboard");
  redirect(`/admin/episodes/${episodeId}/edit?success=1`);
}

/**
 * Swaps episode_number with the adjacent episode in the same title/season.
 * neon-http has no multi-statement transactions, so this is three sequential
 * updates rather than an atomic swap — acceptable for a low-concurrency admin
 * tool, but two admins reordering the same series at once could race.
 */
export async function moveEpisode(episodeId: string, direction: "up" | "down"): Promise<void> {
  const actor = await requireEditorActor();

  const [current] = await db.select().from(episodes).where(eq(episodes.id, episodeId)).limit(1);
  if (!current) throw new Error("Episode not found.");

  const neighborNumber =
    direction === "up" ? current.episodeNumber - 1 : current.episodeNumber + 1;
  if (neighborNumber < 1) return;

  const [neighbor] = await db
    .select()
    .from(episodes)
    .where(
      and(
        eq(episodes.titleId, current.titleId),
        eq(episodes.season, current.season),
        eq(episodes.episodeNumber, neighborNumber),
      ),
    )
    .limit(1);
  if (!neighbor) return; // already at the boundary

  // Park the current episode on an out-of-range number so the unique
  // (title_id, season, episode_number) index doesn't collide mid-swap.
  await db.update(episodes).set({ episodeNumber: -1 }).where(eq(episodes.id, current.id));
  await db
    .update(episodes)
    .set({ episodeNumber: current.episodeNumber })
    .where(eq(episodes.id, neighbor.id));
  await db
    .update(episodes)
    .set({ episodeNumber: neighbor.episodeNumber })
    .where(eq(episodes.id, current.id));

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "episode.reordered",
    targetType: "episode",
    targetId: current.id,
    targetLabel: current.name,
    metadata: { from: current.episodeNumber, to: neighbor.episodeNumber },
  });

  revalidatePath("/admin/episodes");
}

export async function deleteEpisode(episodeId: string): Promise<void> {
  const actor = await requireEditorActor();

  const [episode] = await db
    .select({ name: episodes.name })
    .from(episodes)
    .where(eq(episodes.id, episodeId))
    .limit(1);

  await db.delete(episodes).where(eq(episodes.id, episodeId));

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "episode.deleted",
    targetType: "episode",
    targetId: episodeId,
    targetLabel: episode?.name ?? null,
    metadata: null,
  });

  revalidatePath("/admin/episodes");
  revalidatePath("/admin/dashboard");
}