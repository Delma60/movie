// web/lib/actions/admin-episodes.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db, episodes, titles, users, videoAssets } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import { uploadObject } from "@/lib/s3";
import { parseDurationSeconds } from "@/lib/video-duration";

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

  const [existing] = await db.select().from(episodes).where(eq(episodes.id, episodeId)).limit(1);
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

  const season = Number(seasonRaw || existing.season);
  if (!Number.isFinite(season) || season < 1) fail("invalid_season");

  const episodeNumber = Number(episodeNumberRaw || existing.episodeNumber);
  if (!Number.isFinite(episodeNumber) || episodeNumber < 1) fail("invalid_episode_number");

  let durationMinutes: number | null = existing.durationMinutes;
  if (durationRaw) {
    durationMinutes = Number(durationRaw);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) fail("invalid_duration");
  }

  if (season !== existing.season || episodeNumber !== existing.episodeNumber) {
    const [dup] = await db
      .select({ id: episodes.id })
      .from(episodes)
      .where(
        and(
          eq(episodes.titleId, existing.titleId),
          eq(episodes.season, season),
          eq(episodes.episodeNumber, episodeNumber),
        ),
      )
      .limit(1);
    if (dup && dup.id !== episodeId) fail("duplicate_episode");
  }

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
    metadata: { titleId: existing.titleId, season, episodeNumber },
  });

  revalidatePath("/admin/episodes");
  redirect(`/admin/episodes?updated=${episodeId}`);
}

export async function deleteEpisode(episodeId: string): Promise<void> {
  const actor = await requireEditorActor();

  const [existing] = await db
    .select({ name: episodes.name, titleId: episodes.titleId })
    .from(episodes)
    .where(eq(episodes.id, episodeId))
    .limit(1);
  if (!existing) return;

  await db.delete(episodes).where(eq(episodes.id, episodeId));

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "episode.deleted",
    targetType: "episode",
    targetId: episodeId,
    targetLabel: existing.name,
    metadata: { titleId: existing.titleId },
  });

  revalidatePath("/admin/episodes");
}

export async function moveEpisode(episodeId: string, direction: "up" | "down"): Promise<void> {
  const actor = await requireEditorActor();

  const [current] = await db.select().from(episodes).where(eq(episodes.id, episodeId)).limit(1);
  if (!current) throw new Error("Episode not found.");

  const siblings = await db
    .select()
    .from(episodes)
    .where(and(eq(episodes.titleId, current.titleId), eq(episodes.season, current.season)))
    .orderBy(asc(episodes.episodeNumber));

  const idx = siblings.findIndex((e) => e.id === episodeId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= siblings.length) return;

  const neighbor = siblings[swapIdx];

  await db.update(episodes).set({ episodeNumber: -1 }).where(eq(episodes.id, current.id));
  await db.update(episodes).set({ episodeNumber: current.episodeNumber }).where(eq(episodes.id, neighbor.id));
  await db.update(episodes).set({ episodeNumber: neighbor.episodeNumber }).where(eq(episodes.id, current.id));

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "episode.reordered",
    targetType: "episode",
    targetId: episodeId,
    targetLabel: current.name,
    metadata: { direction, swappedWith: neighbor.id },
  });

  revalidatePath("/admin/episodes");
}

export async function attachEpisodeVideo(formData: FormData): Promise<void> {
  const actor = await requireEditorActor();

  const episodeId = String(formData.get("episodeId") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const durationRaw = String(formData.get("durationSeconds") ?? "").trim();
  const videoFile = formData.get("videoFile");

  if (!episodeId) {
    redirect("/admin/episodes?error=missing_episode");
  }

  const [episode] = await db
    .select({ id: episodes.id, titleId: episodes.titleId, name: episodes.name })
    .from(episodes)
    .where(eq(episodes.id, episodeId))
    .limit(1);

  if (!episode) {
    redirect("/admin/episodes?error=invalid_episode");
  }

  const durationSeconds = parseDurationSeconds(durationRaw);
  const storageProjectId = process.env.STORAGE_PROJECT_ID ?? "movie";
  const storageBucket = process.env.STORAGE_LOGICAL_BUCKET ?? "videos";
  const extension = videoFile && typeof videoFile === "object" && "name" in videoFile
    ? ((videoFile as File).name?.split(".").pop() || "mp4")
    : "mp4";

  let resolvedSourceUrl = sourceUrl || null;
  if (videoFile && typeof videoFile === "object" && "arrayBuffer" in videoFile && typeof (videoFile as File).arrayBuffer === "function") {
    const file = videoFile as File;
    if (file.size > 0) {
      const name = `${episode.id}-${Date.now()}.${extension}`;
      resolvedSourceUrl = await uploadObject(storageProjectId, storageBucket, name, file);
    }
  }

  if (!resolvedSourceUrl) {
    redirect(`/admin/episodes?error=missing_source&episodeId=${episodeId}`);
  }

  const [existingAsset] = await db
    .select({ id: videoAssets.id })
    .from(videoAssets)
    .where(eq(videoAssets.episodeId, episode.id))
    .limit(1);

  if (existingAsset) {
    await db
      .update(videoAssets)
      .set({
        sourceUrl: resolvedSourceUrl,
        status: "ready",
        durationSeconds,
      })
      .where(eq(videoAssets.episodeId, episode.id));
  } else {
    await db.insert(videoAssets).values({
      episodeId: episode.id,
      sourceUrl: resolvedSourceUrl,
      status: "ready",
      durationSeconds,
    });
  }

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "episode.video_attached",
    targetType: "episode",
    targetId: episode.id,
    targetLabel: episode.name,
    metadata: { titleId: episode.titleId, sourceUrl: resolvedSourceUrl, durationSeconds },
  });

  revalidatePath("/admin/episodes");
  revalidatePath("/watch");
  redirect(`/admin/episodes?video=${episode.id}`);
}