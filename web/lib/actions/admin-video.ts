"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extname } from "path";
import { eq } from "drizzle-orm";
import { db, videoAssets, users } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import { uploadObject } from "@/lib/s3";
import type { VideoStatus } from "@/lib/db/schema";

const VALID_STATUSES: VideoStatus[] = ["processing", "ready", "failed"];

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

function isUpload(value: unknown): value is File {
  return value instanceof File;
}

export async function attachVideoAsset(formData: FormData): Promise<void> {
  const actor = await requireEditorActor();

  const titleId = String(formData.get("titleId") ?? "").trim() || null;
  const episodeId = String(formData.get("episodeId") ?? "").trim() || null;
  const returnTo = String(formData.get("returnTo") ?? "/admin/titles");
  const sourceUrlInput = String(formData.get("sourceUrl") ?? "").trim();
  const file = formData.get("videoFile");

  if (!titleId && !episodeId) {
    redirect(`${returnTo}?error=missing_target`);
  }

  let sourceUrl = sourceUrlInput || null;
  let status: VideoStatus = "ready";

  if (isUpload(file) && file.size > 0) {
    const storageProjectId = process.env.STORAGE_PROJECT_ID ?? "movie";
    const storageBucket = process.env.STORAGE_LOGICAL_BUCKET ?? "video";
    const extension = extname(file.name) || ".mp4";
    const name = `${titleId ?? episodeId}-${Date.now()}${extension}`;
    sourceUrl = await uploadObject(storageProjectId, storageBucket, name, file);
    status = "processing";
  }

  if (!sourceUrl) {
    redirect(`${returnTo}?error=missing_source`);
  }

  const [existing] = await db
    .select({ id: videoAssets.id })
    .from(videoAssets)
    .where(titleId ? eq(videoAssets.titleId, titleId) : eq(videoAssets.episodeId, episodeId!))
    .limit(1);

  if (existing) {
    await db.update(videoAssets).set({ sourceUrl, status }).where(eq(videoAssets.id, existing.id));
  } else {
    await db.insert(videoAssets).values({ titleId, episodeId, sourceUrl, status });
  }

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "video.attached",
    targetType: titleId ? "title" : "episode",
    targetId: titleId ?? episodeId,
    targetLabel: sourceUrl,
    metadata: { status },
  });

  revalidatePath("/admin/titles");
  revalidatePath("/admin/episodes");
  redirect(`${returnTo}?video=attached`);
}

export async function updateVideoStatus(videoAssetId: string, status: VideoStatus): Promise<void> {
  const actor = await requireEditorActor();

  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid video status.");
  }

  await db.update(videoAssets).set({ status }).where(eq(videoAssets.id, videoAssetId));

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "video.status_changed",
    targetType: "video",
    targetId: videoAssetId,
    targetLabel: null,
    metadata: { to: status },
  });

  revalidatePath("/admin/titles");
  revalidatePath("/admin/episodes");
}
